#!/usr/bin/env python3
import argparse
import json
import re
import subprocess
import sys
import threading
import time
from pathlib import Path

import telemetry

ROOT = Path(__file__).resolve().parent
BLACKBOARD = ROOT / "blackboard"
QUEUE_DIR = BLACKBOARD / "queue"
COMPLETE_DIR = BLACKBOARD / "complete"
ERROR_DIR = BLACKBOARD / "error"
PROJECTS_DIR = ROOT / "projects"
PROJECT_ROOT = ROOT

REQUIRES = {0: (), 1: (), 2: (1,), 3: (1, 2), 4: (1,), 5: (1, 4), 6: (1, 2, 3, 5), 7: (2, 4, 6), 8: (7,)}
ALLOWED_AGENTS = ("agent-wiring", "agent-model", "agent-core", "agent-container", "agent-ui")
REQUIRED_KEYS = ("id", "targetAgent", "stage", "dependsOn", "path", "kind", "layer", "feature", "export", "intent")
LAYERS = ("core", "shared", "features", "layout", "root")
ID_PATTERN = re.compile(r"^T([0-8])-(\d{3})$")
DATA_SUFFIXES = (".service.ts", ".store.ts", ".api.ts", ".guard.ts", ".interceptor.ts", ".resolver.ts")
UX_KIND = "ux"
COMPONENT_SUFFIX = ".component.ts"
SUFFIX_KINDS = (
    (".model.ts", "model"),
    (".service.ts", "service"),
    (".store.ts", "store"),
    (".api.ts", "api"),
    (".guard.ts", "guard"),
    (".interceptor.ts", "interceptor"),
    (".resolver.ts", "resolver"),
    (".pipe.ts", "pipe"),
    (".directive.ts", "directive"),
    (".routes.ts", "route"),
    (".providers.ts", "provider"),
)
PROMPT_KEYS = ("id", "path", "kind", "layer", "feature", "export", "intent", "dependsOn")
VERIFY_MODES = ("none", "typecheck", "build")
VERIFICATION_COMMANDS = {
    "typecheck": ("npx", "tsc", "--noEmit", "-p", "tsconfig.app.json"),
    "build": ("npx", "ng", "build", "--configuration", "development"),
}
VERIFY_ERROR = re.compile(r"error (?:TS|NG)\d+", re.IGNORECASE)
RUNNER_SCRIPT = "runner.py"
ARCHITECT_PROMPT = (
    "You are the blackboard architect agent for this repository.\n"
    "The generated Angular project root is {project_root}: every task `path` "
    "(e.g. src/app/...) resolves relative to it, and the scaffolding runs inside it.\n"
    "Build request:\n{request}\n\n"
    "Follow these steps exactly:\n"
    "1. Follow your agent instructions and both architecture skills "
    "(angular-architect and task-descomposition).\n"
    "2. Write the Architecture Plan to blackboard/complete/architecture-plan.md.\n"
    "3. Decompose the plan into task files (one artifact per task, schema per the "
    "task-descomposition skill). Write the task JSON files under /tmp/tasks/ and queue the "
    "whole batch with one command: python3 {runner} --emit /tmp/tasks/T1-001.json ... "
    "Fix any validation error and re-emit. Never write into blackboard/queue/ directly.\n"
    "4. Do not create or modify application source files.\n"
    "5. Finish by listing the queued task ids, their stages, and their target agents."
)
TRANSLATOR_PROMPT = (
    "You are the blackboard spec translator agent for this repository.\n"
    "Read the human application description at {description} and translate it into the "
    "JSON product seed consumed by the architect, written to {seed}.\n"
    "Follow your agent instructions exactly:\n"
    "1. Read {description}.\n"
    "2. Produce the seed JSON in the exact structure of seed/001_seed.json.\n"
    "3. Write it to a temp file under /tmp/, then run: "
    "python3 .opencode/skills/writer-file/script/writer_file.py --source <temp> --target {seed}\n"
    "4. Fix any validation error and re-run until the script exits 0.\n"
    "5. Do not create or modify application source files.\n"
    "6. Finish by confirming {seed} was written."
)


def resolve_output_path(output, seed):
    if output:
        candidate = Path(output).expanduser()
        return candidate if candidate.is_absolute() else (ROOT / candidate)
    name = "app"
    if seed:
        try:
            spec = json.loads(Path(seed).expanduser().read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            spec = None
        project = spec.get("project") if isinstance(spec, dict) else None
        candidate_name = project.get("name") if isinstance(project, dict) else None
        if isinstance(candidate_name, str) and candidate_name.strip():
            name = re.sub(r"[^A-Za-z0-9._-]+", "-", candidate_name.strip()).strip("-") or "app"
    return PROJECTS_DIR / name


def set_project_root(path):
    global PROJECT_ROOT
    PROJECT_ROOT = Path(path).expanduser().resolve()
    PROJECT_ROOT.mkdir(parents=True, exist_ok=True)
    return PROJECT_ROOT


def get_project_root():
    return PROJECT_ROOT


def stage_of(path):
    name = path.rsplit("/", 1)[-1]
    if name.endswith(".model.ts") or path.startswith("src/app/shared/models/"):
        return 1
    if path.startswith("src/app/core/"):
        return 2
    if re.match(r"^src/app/features/[^/]+/data/", path):
        return 3
    if path.startswith("src/app/shared/"):
        return 4
    if re.match(r"^src/app/features/[^/]+/ui/", path):
        return 5
    if re.match(r"^src/app/features/[^/]+/feature/", path):
        return 6
    if path.startswith("src/app/layout/") or re.match(r"^src/app/features/[^/]+/[^/]+\.routes\.ts$", path):
        return 7
    if name.startswith("app.") and name.endswith(".ts"):
        return 8
    if path in ("src/main.ts", "src/index.html"):
        return 8
    return None


def agent_of(path):
    name = path.rsplit("/", 1)[-1]
    if name.endswith((".routes.ts", ".providers.ts")) or name == "app.config.ts":
        return "agent-wiring"
    if name.endswith(".model.ts"):
        return "agent-model"
    if name.endswith(DATA_SUFFIXES):
        return "agent-core"
    if name.endswith((".pipe.ts", ".directive.ts")):
        return "agent-ui"
    if name == "app.component.ts":
        return "agent-ui"
    if name.endswith(COMPONENT_SUFFIX):
        return "agent-container"
    if name in ("main.ts", "index.html"):
        return "agent-wiring"
    return None


def kind_of(path):
    name = path.rsplit("/", 1)[-1]
    if name.endswith(".component.ts"):
        if re.match(r"^src/app/features/[^/]+/feature/", path):
            return "container"
        if "/ui/" in path or path.startswith("src/app/layout/") or name == "app.component.ts":
            return "ui"
        return None
    if name in ("app.config.ts", "main.ts", "index.html"):
        return "config"
    for suffix, kind in SUFFIX_KINDS:
        if name.endswith(suffix):
            return kind
    return None


def layer_of(path):
    if path.startswith("src/app/core/"):
        return "core"
    if path.startswith("src/app/shared/"):
        return "shared"
    if path.startswith("src/app/features/"):
        return "features"
    if path.startswith("src/app/layout/"):
        return "layout"
    if path.rsplit("/", 1)[-1].startswith("app.") and path.endswith(".ts"):
        return "root"
    if path in ("src/main.ts", "src/index.html"):
        return "root"
    return None


def task_sort_key(task):
    return (task["stage"], task["path"], 1 if task.get("kind") == UX_KIND else 0)


def read_queue():
    entries = []
    for file in QUEUE_DIR.glob("*.json"):
        try:
            task = json.loads(file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            entries.append(((999, file.name), file, None, f"unreadable JSON: {exc}"))
            continue
        if not isinstance(task, dict):
            entries.append(((998, file.name), file, None, "task must be a JSON object"))
            continue
        stage = task.get("stage")
        path = task.get("path")
        if isinstance(stage, int) and isinstance(path, str):
            entries.append((task_sort_key(task), file, task, None))
        else:
            entries.append(((997, file.name), file, task, None))
    entries.sort(key=lambda entry: entry[0])
    return entries


def load_index():
    index = {}
    for folder in (QUEUE_DIR, COMPLETE_DIR):
        for file in folder.glob("*.json"):
            try:
                task = json.loads(file.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError):
                continue
            if isinstance(task, dict) and isinstance(task.get("id"), str):
                index[task["id"]] = task
    return index


def validate_stage0(task):
    if not isinstance(task["path"], str) or not task["path"].strip():
        return "stage 0 path must be a non-empty string"
    if task["path"].startswith("src/app/"):
        return "stage 0 path must not sit under src/app/"
    if task["targetAgent"] != "agent-container":
        return "stage 0 targetAgent must be agent-container"
    if task["kind"] not in ("config", "provider"):
        return "stage 0 kind must be config or provider"
    if task["layer"] != "root":
        return "stage 0 layer must be root"
    if task["feature"] is not None:
        return "stage 0 feature must be null"
    if task["dependsOn"]:
        return "stage 0 dependsOn must be empty"
    if not isinstance(task["export"], str) or not task["export"].strip():
        return "export must be a non-empty string"
    if not isinstance(task["intent"], str) or not task["intent"].strip():
        return "intent must be a non-empty string"
    return None


def validate(task, index):
    if set(task) != set(REQUIRED_KEYS):
        missing = sorted(set(REQUIRED_KEYS) - set(task))
        extra = sorted(set(task) - set(REQUIRED_KEYS))
        return f"schema mismatch, missing={missing} extra={extra}"
    if not isinstance(task["stage"], int) or task["stage"] not in REQUIRES:
        return "stage must be an integer 0-8"
    match = ID_PATTERN.match(str(task["id"]))
    if not match:
        return "id must match ^T[0-8]-\\d{3}$"
    if int(match.group(1)) != task["stage"]:
        return "id stage suffix differs from stage"
    if task["stage"] == 0:
        return validate_stage0(task)
    root_files = ("src/main.ts", "src/index.html")
    if not isinstance(task["path"], str):
        return "path must be a string"
    if task["path"] not in root_files and not task["path"].endswith(".ts"):
        return "path must sit under src/app/ (or be src/main.ts or src/index.html) and end in .ts"
    if not (task["path"].startswith("src/app/") or task["path"] in root_files):
        return "path must sit under src/app/, or be src/main.ts or src/index.html"
    expected_stage = stage_of(task["path"])
    if expected_stage is None:
        return "path matches no stage"
    if task["stage"] != expected_stage:
        return f"stage must be {expected_stage} for this path"
    is_ux = task["kind"] == UX_KIND
    expected_agent = "agent-ui" if is_ux else agent_of(task["path"])
    if expected_agent is None:
        return "path matches no agent mapping"
    if task["targetAgent"] != expected_agent:
        return f"targetAgent must be {expected_agent}"
    if task["targetAgent"] not in ALLOWED_AGENTS:
        return f"targetAgent must be one of {list(ALLOWED_AGENTS)}"
    expected_kind = kind_of(task["path"])
    if expected_kind is None:
        return "path matches no kind mapping"
    if is_ux:
        if not task["path"].endswith(COMPONENT_SUFFIX) or expected_kind != "ui":
            return "ux tasks must target a presentational component"
    elif task["kind"] != expected_kind:
        return f"kind must be {expected_kind}"
    expected_layer = layer_of(task["path"])
    if expected_layer is None:
        return "path matches no layer"
    if task["layer"] != expected_layer:
        return f"layer must be {expected_layer}"
    has_feature = isinstance(task["feature"], str) and bool(task["feature"])
    if task["layer"] == "features":
        if not has_feature:
            return "feature required when layer is features"
        if task["feature"] != task["path"].split("/")[3]:
            return "feature must equal the features/<f> path segment"
    elif has_feature:
        return "feature must be null unless layer is features"
    if not isinstance(task["export"], str) or not task["export"].strip():
        return "export must be a non-empty string"
    if not isinstance(task["intent"], str) or not task["intent"].strip():
        return "intent must be a non-empty string"
    if not isinstance(task["dependsOn"], list):
        return "dependsOn must be a list"
    current = task_sort_key(task)
    for dep in task["dependsOn"]:
        if not isinstance(dep, str) or not ID_PATTERN.match(dep):
            return f"dependsOn id invalid: {dep!r}"
        dep_task = index.get(dep)
        if dep_task is None or not isinstance(dep_task.get("stage"), int) or not isinstance(dep_task.get("path"), str):
            return f"dependsOn {dep} not resolvable in queue or complete"
        if task_sort_key(dep_task) >= current:
            return f"dependsOn {dep} does not sort before this task"
    return None


def claimable(task, queued, complete_ids):
    if any(dep not in complete_ids for dep in task["dependsOn"]):
        return False
    queued_stages = {item["stage"] for item in queued}
    return all(stage not in queued_stages for stage in REQUIRES[task["stage"]])


def send_to_error(file, reason, task):
    if task is None:
        try:
            task = json.loads(file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            task = {"raw": file.read_text(encoding="utf-8", errors="replace")}
    payload = dict(task) if isinstance(task, dict) else {"raw": str(task)}
    payload["error"] = reason
    with telemetry.span("blackboard.error", {"file": file.name, "reason": reason, **telemetry.task_attributes(payload)}) as current:
        telemetry.mark_error(current, reason)
        (ERROR_DIR / file.name).write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
        file.unlink()


def _agent_name(command):
    try:
        return command[command.index("--agent") + 1]
    except (ValueError, IndexError):
        return None


def run_agent(command, timeout, cwd):
    with telemetry.span("blackboard.agent", {"agent": _agent_name(command), "timeout": timeout}) as current:
        ok, reason = _run_agent(command, timeout, cwd)
        if not ok:
            telemetry.mark_error(current, reason)
        return ok, reason


def _run_agent(command, timeout, cwd):
    try:
        process = subprocess.Popen(
            command,
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            cwd=str(cwd),
        )
    except OSError as exc:
        return False, f"cannot launch {command[0]}: {exc}"
    timed_out = {"flag": False}

    def kill_on_timeout():
        timed_out["flag"] = True
        process.kill()

    watchdog = threading.Timer(timeout, kill_on_timeout)
    watchdog.start()
    lines = []
    try:
        for line in process.stdout:
            print(f"    | {line.rstrip()}")
            lines.append(line)
        process.wait()
    finally:
        watchdog.cancel()
    if timed_out["flag"]:
        return False, f"agent timed out after {timeout}s"
    if process.returncode != 0:
        tail = "".join(lines).strip()[-1000:]
        return False, f"agent exited {process.returncode}: {tail}"
    return True, ""


def _verify_tail(text, limit=1200):
    return text.strip()[-limit:]


def _task_verification_errors(output, path):
    name = Path(path).name
    blocking = []
    for line in output.splitlines():
        if not VERIFY_ERROR.search(line):
            continue
        if path not in line and name not in line:
            continue
        if "TS2307" in line:
            continue
        blocking.append(line.strip())
    return blocking


def _run_verification(command, project_root, timeout):
    try:
        process = subprocess.run(
            command,
            cwd=str(project_root),
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=timeout,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        return None, f"verification could not run: {exc}"
    return process.returncode, process.stdout or ""


def run_verification(project_root, mode, scope, task, timeout):
    command = VERIFICATION_COMMANDS.get(mode)
    if command is None:
        return True, ""
    with telemetry.span("blackboard.verify", {"file": f"{task['id']}.json", "mode": mode}) as current:
        code, output = _run_verification(command, project_root, timeout)
        if code is None:
            telemetry.mark_error(current, output)
            return False, output
        if code == 0:
            return True, ""
        if scope == "task":
            blocking = _task_verification_errors(output, task["path"])
            if not blocking:
                return True, ""
            reason = f"verification failed for {task['path']}: {_verify_tail(chr(10).join(blocking))}"
        else:
            reason = f"verification failed: {_verify_tail(output)}"
        telemetry.mark_error(current, reason)
        return False, reason


def verify_project(project_root, mode, timeout):
    command = VERIFICATION_COMMANDS.get(mode)
    if command is None:
        return True, ""
    with telemetry.span("blackboard.verify", {"scope": "project", "mode": mode}) as current:
        code, output = _run_verification(command, project_root, timeout)
        if code is None:
            telemetry.mark_error(current, output)
            return False, output
        if code == 0:
            return True, ""
        reason = f"verification failed: {_verify_tail(output)}"
        telemetry.mark_error(current, reason)
        return False, reason


def invoke_agent(task, auto_approve, timeout):
    message = (
        f"Project root: {get_project_root()}\n"
        "Create exactly one file for this blackboard task, resolving `path` against the "
        "project root above. Task JSON:\n"
    )
    message += json.dumps({key: task[key] for key in PROMPT_KEYS}, indent=2)
    command = ["opencode", "run", "--agent", task["targetAgent"], "--dir", str(ROOT)]
    if auto_approve:
        command.append("--auto")
    command.append(message)
    print(f"[cmd ] opencode run --agent {task['targetAgent']} --dir {ROOT}")
    return run_agent(command, timeout, ROOT)


def emit_tasks(paths):
    index = load_index()
    staged = []
    with telemetry.span("blackboard.emit", {"tasks.requested": len(paths)}) as current:
        for raw in paths:
            source = Path(raw)
            try:
                task = json.loads(source.read_text(encoding="utf-8"))
            except (OSError, json.JSONDecodeError) as exc:
                reason = f"{source}: unreadable JSON: {exc}"
                telemetry.mark_error(current, reason)
                return reason
            if not isinstance(task, dict):
                reason = f"{source}: task must be a JSON object"
                telemetry.mark_error(current, reason)
                return reason
            reason = validate(task, index)
            if reason:
                reason = f"{source}: {reason}"
                telemetry.mark_error(current, reason)
                return reason
            if (QUEUE_DIR / f"{task['id']}.json").exists():
                reason = f"{task['id']}: already queued"
                telemetry.mark_error(current, reason)
                return reason
            index[task["id"]] = task
            staged.append(task)
        for task in staged:
            destination = QUEUE_DIR / f"{task['id']}.json"
            with telemetry.span("blackboard.queue", {"file": destination.name, **telemetry.task_attributes(task)}):
                destination.write_text(json.dumps(task, indent=2) + "\n", encoding="utf-8")
            print(f"[emit] {task['id']} -> queue/{destination.name}")
        if current is not None:
            current.set_attribute("tasks.emitted", len(staged))
    return None


def seed_output_for(description_path):
    source = Path(description_path).expanduser()
    source = source if source.is_absolute() else (ROOT / source)
    source = source.resolve()
    stem = source.stem
    if stem.endswith("_description"):
        stem = stem[: -len("_description")] + "_seed"
    else:
        stem = stem + "_seed"
    return source.with_name(stem + ".json")


def load_seed(path):
    source = Path(path).expanduser()
    if not source.is_absolute():
        source = ROOT / source
    source = source.resolve()
    if QUEUE_DIR.resolve() in source.parents:
        return None, f"seed file must not live inside {QUEUE_DIR.relative_to(ROOT)}/ (it would be consumed as a task); move it to another folder"
    try:
        raw = source.read_text(encoding="utf-8")
    except OSError as exc:
        return None, f"cannot read seed file {source}: {exc}"
    try:
        spec = json.loads(raw)
    except json.JSONDecodeError as exc:
        return None, f"seed file {source} is not valid JSON: {exc}"
    return "Product specification (JSON seed):\n" + json.dumps(spec, indent=2), None


def load_request(args):
    if args.seed:
        return load_seed(args.seed)
    return args.architect, None


def run_architect(args, request, runner_script):
    with telemetry.span("blackboard.architect", {"request.chars": len(request)}):
        message = ARCHITECT_PROMPT.format(request=request, runner=runner_script, project_root=PROJECT_ROOT)
        command = ["opencode", "run", "--agent", "agent-architect", "--dir", str(ROOT)]
        if not args.no_auto:
            command.append("--auto")
        command.append(message)
        print(f"[cmd ] opencode run --agent agent-architect --dir {ROOT}")
        return run_agent(command, args.timeout, ROOT)


def run_translator(args, description, seed_path):
    with telemetry.span("blackboard.translator", {"description": str(description), "seed": str(seed_path)}) as current:
        message = TRANSLATOR_PROMPT.format(description=description, seed=seed_path)
        command = ["opencode", "run", "--agent", "agent-spec-translator", "--dir", str(ROOT)]
        if not args.no_auto:
            command.append("--auto")
        command.append(message)
        print(f"[cmd ] opencode run --agent agent-spec-translator --dir {ROOT}")
        ok, reason = run_agent(command, args.timeout, ROOT)
        if ok and not Path(seed_path).exists():
            ok, reason = False, f"translator finished but {seed_path} was not created"
        if not ok:
            telemetry.mark_error(current, reason)
        return ok, reason


def run_pass(args):
    processed = 0
    while True:
        entries = read_queue()
        if not entries:
            return processed, []
        dirty = False
        tasks = []
        for _, file, task, reason in entries:
            if reason:
                send_to_error(file, reason, task)
                print(f"[error] {file.name}: {reason}")
                dirty = True
            else:
                tasks.append((file, task))
        if dirty:
            continue
        index = load_index()
        kept = []
        for file, task in tasks:
            reason = validate(task, index)
            if reason:
                send_to_error(file, reason, task)
                print(f"[error] {file.name}: {reason}")
                dirty = True
            else:
                kept.append((file, task))
        if dirty:
            continue
        complete_ids = {file.stem for file in COMPLETE_DIR.glob("*.json")}
        queued = [task for _, task in kept]
        ready = [(file, task) for file, task in kept if claimable(task, queued, complete_ids)]
        if not ready:
            return processed, [task["id"] for _, task in kept]
        file, task = ready[0]
        print(f"[run ] {task['id']} -> {task['targetAgent']} ({task['path']})")
        ok, reason = invoke_agent(task, not args.no_auto, args.timeout)
        if ok and task["stage"] != 0 and not (PROJECT_ROOT / task["path"]).exists():
            ok, reason = False, f"agent finished but {task['path']} was not created"
        if ok:
            ok, reason = run_verification(PROJECT_ROOT, args.verify, args.verify_scope, task, args.verify_timeout)
        if ok:
            with telemetry.span("blackboard.complete", {"file": file.name, **telemetry.task_attributes(task)}):
                file.replace(COMPLETE_DIR / file.name)
            print(f"[done] {task['id']}")
        else:
            send_to_error(file, reason, task)
            print(f"[fail] {task['id']}: {reason}")
        processed += 1
        if args.limit and processed >= args.limit:
            return processed, []


def main():
    parser = argparse.ArgumentParser(description="Blackboard orchestrator: reads tasks from blackboard/queue in deterministic order, invokes the mapped agent, and moves each task file to blackboard/complete or blackboard/error.")
    parser.add_argument("--watch", action="store_true", help="poll the queue continuously")
    parser.add_argument("--interval", type=int, default=5, help="seconds between polls in watch mode")
    parser.add_argument("--timeout", type=int, default=600, help="seconds before an agent run is aborted")
    parser.add_argument("--verify", choices=VERIFY_MODES, default="typecheck", help="post-task compile gate run in the project root: 'typecheck' (tsc --noEmit), 'build' (ng build), or 'none'")
    parser.add_argument("--verify-scope", choices=("task", "global"), default="task", help="'task' fails a task only when its own file has compile errors; 'global' fails on any compile error in the project")
    parser.add_argument("--verify-timeout", type=int, default=300, help="seconds before the verification command is aborted")
    parser.add_argument("--limit", type=int, default=0, help="stop after N tasks (0 = no limit)")
    parser.add_argument("--no-auto", action="store_true", help="do not pass --auto to opencode")
    parser.add_argument("--output", metavar="DIR", help="directory where the Angular project is generated (default: projects/<seed name> inside this repo; external paths require external_directory access in the agent configs)")
    request_group = parser.add_mutually_exclusive_group()
    request_group.add_argument("--architect", metavar="REQUEST", help="invoke the architect agent with this inline build request before processing the queue")
    request_group.add_argument("--seed", metavar="FILE", help="path to a JSON file containing the product specification; the architect agent starts from it before processing the queue")
    request_group.add_argument("--translate", metavar="FILE", help="path to a human-readable description (e.g. seed/001_description.md); runs the spec-translator agent to write seed/<n>_seed.json, then the architect")
    parser.add_argument("--emit", nargs="+", metavar="FILE", help="validate these task JSON files against the schema, write them to blackboard/queue, and exit")
    args = parser.parse_args()
    telemetry.init_telemetry()
    for folder in (QUEUE_DIR, COMPLETE_DIR, ERROR_DIR):
        folder.mkdir(parents=True, exist_ok=True)
    if args.emit:
        reason = emit_tasks(args.emit)
        if reason:
            print(f"[emit-error] {reason}")
            return 1
        return 0
    seed_path = None
    if args.translate:
        seed_path = seed_output_for(args.translate)
        ok, reason = run_translator(args, args.translate, seed_path)
        if not ok:
            print(f"[fatal] translator: {reason}")
            return 1
        print(f"[seed ] translated -> {seed_path}")
    project_root = set_project_root(resolve_output_path(args.output, str(seed_path) if seed_path else args.seed))
    print(f"[root] generated project: {project_root}")
    request = None
    if seed_path:
        request, reason = load_seed(str(seed_path))
        if reason:
            print(f"[fatal] {reason}")
            return 2
    elif args.architect or args.seed:
        request, reason = load_request(args)
        if reason:
            print(f"[fatal] {reason}")
            return 2
    try:
        if request is not None:
            print(f"[plan ] architect: {request[:80].replace(chr(10), ' ')}...")
            ok, reason = run_architect(args, request, RUNNER_SCRIPT)
            if not ok:
                print(f"[fatal] architect: {reason}")
                return 1
            print("[plan ] architect finished; processing queue")
        if args.watch:
            while True:
                run_pass(args)
                time.sleep(args.interval)
        processed, blocked = run_pass(args)
    except KeyboardInterrupt:
        return 130
    if blocked:
        print(f"[blocked] {', '.join(blocked)}")
        return 1
    if args.verify != "none":
        ok, reason = verify_project(PROJECT_ROOT, args.verify, args.verify_timeout)
        if not ok:
            print(f"[fatal] {reason}")
            return 1
        print(f"[verify] project passes {args.verify}")
    print(f"[ok] processed {processed} task(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
