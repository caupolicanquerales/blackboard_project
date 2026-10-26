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
UX_KIND = "ux"

VERIFY_MODES = ("none", "typecheck", "build")
RUNNER_SCRIPT = "runner.py"

ARCHITECT_PROMPT = (
    "You are the Universal blackboard architect agent for this repository.\n"
    "The generated project root is {project_root}: every task `path` resolves relative to it.\n"
    "Build request / Product Seed:\n{request}\n\n"
    "Follow these steps exactly:\n"
    "1. Read seed.json and dynamically load the universal task-descomposition skill "
    "and target framework architect skill as specified in seed.json.\n"
    "2. Write the Architecture Plan to blackboard/complete/architecture-plan.md.\n"
    "3. Decompose the plan into task files using task-descomposition. "
    "Write task JSON files under /tmp/tasks/ and queue the batch with one command: "
    "python3 {runner} --emit /tmp/tasks/T0-001.json ...\n"
    "Fix any validation errors and re-emit. Never write into blackboard/queue/ directly.\n"
    "4. Do not create or modify application source files.\n"
    "5. Finish by listing queued task ids, stages, target framework, and target agents."
)

TRANSLATOR_PROMPT = (
    "You are the blackboard spec translator agent for this repository.\n"
    "Read the human application description at {description} (including the Framework section) "
    "and translate it into the JSON product seed consumed by the architect, written to {seed}.\n"
    "Follow your agent instructions exactly:\n"
    "1. Read {description}.\n"
    "2. Detect the platform and framework (e.g. Angular, React, React Native, Flutter) and write "
    "platform, layoutParadigm, framework, and skills[] into {seed}.\n"
    "3. Write the seed JSON to a temp file under /tmp/, then run: "
    "python3 .opencode/skills/writer-file/script/writer_file.py --source <temp> --target {seed}\n"
    "4. Fix any validation error and re-run until the script exits 0.\n"
    "5. Do not create or modify application source files.\n"
    "6. Finish by confirming {seed} was written."
)


def get_framework_verification_commands(project_root, mode):
    """Detect the project stack from its config files and return the verification command.

    Returns None when mode is 'none', when no known stack is detected, or when the
    detected stack has no applicable check for the requested mode.
    """
    if mode == "none":
        return None

    if (project_root / "pubspec.yaml").exists():
        return ("flutter", "analyze") if mode == "typecheck" else ("flutter", "build", "bundle")

    if (project_root / "angular.json").exists():
        return ("npx", "tsc", "--noEmit") if mode == "typecheck" else ("npx", "ng", "build", "--configuration", "development")

    if (project_root / "package.json").exists():
        if mode == "typecheck":
            if (project_root / "tsconfig.json").exists() or (project_root / "tsconfig.app.json").exists():
                return ("npx", "tsc", "--noEmit")
            return None
        return ("npm", "run", "build")

    if (project_root / "go.mod").exists():
        return ("go", "vet", "./...") if mode == "typecheck" else ("go", "build", "./...")

    if (project_root / "Cargo.toml").exists():
        return ("cargo", "check") if mode == "typecheck" else ("cargo", "build")

    if any((project_root / name).exists() for name in ("pyproject.toml", "setup.py", "setup.cfg", "requirements.txt")):
        # Python has no separate compile step; byte-compile the tree as the gate for both modes.
        return (sys.executable, "-m", "compileall", "-q", ".")

    return None


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
    if task["targetAgent"] not in ALLOWED_AGENTS:
        return f"stage 0 targetAgent must be one of {list(ALLOWED_AGENTS)}"
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
    """Universal task schema validation."""
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
    
    if not isinstance(task["path"], str) or not task["path"].strip():
        return "path must be a non-empty string"
    if task["targetAgent"] not in ALLOWED_AGENTS:
        return f"targetAgent must be one of {list(ALLOWED_AGENTS)}"
    if task["layer"] not in LAYERS:
        return f"layer must be one of {list(LAYERS)}"
    
    has_feature = isinstance(task["feature"], str) and bool(task["feature"])
    if task["layer"] == "features" and not has_feature:
        return "feature required when layer is features"
    elif task["layer"] != "features" and has_feature:
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
    command = get_framework_verification_commands(project_root, mode)
    if command is None:
        return True, ""
    with telemetry.span("blackboard.verify", {"file": f"{task['id']}.json", "mode": mode}) as current:
        code, output = _run_verification(command, project_root, timeout)
        if code is None:
            telemetry.mark_error(current, output)
            return False, output
        if code == 0:
            return True, ""
        reason = f"verification failed: {_verify_tail(output)}"
        telemetry.mark_error(current, reason)
        return False, reason


def verify_project(project_root, mode, timeout):
    command = get_framework_verification_commands(project_root, mode)
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
        "Create/update the file for this blackboard task, resolving `path` against the "
        "project root above. Task JSON:\n"
    )
    message += json.dumps({key: task[key] for key in ("id", "path", "kind", "layer", "feature", "export", "intent", "dependsOn")}, indent=2)
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
            if task["id"] in index:
                reason = f"{task['id']}: id already exists in queue or complete"
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
    parser = argparse.ArgumentParser(description="Universal Blackboard orchestrator script.")
    parser.add_argument("--watch", action="store_true", help="poll the queue continuously")
    parser.add_argument("--interval", type=int, default=5, help="seconds between polls in watch mode")
    parser.add_argument("--timeout", type=int, default=600, help="seconds before an agent run is aborted")
    parser.add_argument("--verify", choices=VERIFY_MODES, default="typecheck", help="post-task compile/check gate run in the project root")
    parser.add_argument("--verify-scope", choices=("task", "global"), default="task", help="verification scope")
    parser.add_argument("--verify-timeout", type=int, default=300, help="seconds before verification times out")
    parser.add_argument("--limit", type=int, default=0, help="stop after N tasks (0 = no limit)")
    parser.add_argument("--no-auto", action="store_true", help="do not pass --auto to opencode")
    parser.add_argument("--output", metavar="DIR", help="directory where the project is generated")
    request_group = parser.add_mutually_exclusive_group()
    request_group.add_argument("--architect", metavar="REQUEST", help="invoke the architect agent with this inline build request")
    request_group.add_argument("--seed", metavar="FILE", help="path to JSON seed file")
    request_group.add_argument("--translate", metavar="FILE", help="path to description markdown file")
    parser.add_argument("--emit", nargs="+", metavar="FILE", help="validate and emit task JSON files to queue")
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