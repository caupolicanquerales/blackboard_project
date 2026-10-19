#!/usr/bin/env python3
import argparse
import json
import os
import shutil
import sys
import time
from pathlib import Path

import telemetry
from runner import (
    ROOT,
    QUEUE_DIR,
    COMPLETE_DIR,
    ERROR_DIR,
    PROMPT_KEYS,
    VERIFY_MODES,
    ARCHITECT_PROMPT,
    TRANSLATOR_PROMPT,
    read_queue,
    load_index,
    validate,
    claimable,
    send_to_error,
    emit_tasks,
    load_request,
    load_seed,
    seed_output_for,
    run_agent,
    run_verification,
    verify_project,
    resolve_output_path,
    set_project_root,
    get_project_root,
)

GITHUB_AGENTS_DIR = ROOT / ".github" / "agents"
RUNNER_SCRIPT = "runner_github.py"
DEFAULT_COPILOT_BIN = os.environ.get("COPILOT_BIN", "copilot")
DEFAULT_ALLOW_TOOL = os.environ.get("COPILOT_ALLOW_TOOL", "read,write,shell")


def list_profiles():
    profiles = []
    if not GITHUB_AGENTS_DIR.is_dir():
        return profiles
    files = sorted(set(GITHUB_AGENTS_DIR.rglob("*.agent.md")) | set(GITHUB_AGENTS_DIR.rglob("*.md")))
    for file in files:
        relative = file.relative_to(GITHUB_AGENTS_DIR)
        stem = file.name.removesuffix(".agent.md").removesuffix(".md")
        parent = relative.parts[0] if len(relative.parts) > 1 else ""
        agent_id = stem if not parent else f"{parent}--{stem}"
        profiles.append({"file": file, "stem": stem, "parent": parent, "id": agent_id})
    return profiles


def resolve_profile(target_agent, profiles):
    for rule in ("parent", "stem", "id"):
        matches = [profile for profile in profiles if profile[rule] == target_agent]
        if len(matches) == 1:
            return matches[0], None
        if len(matches) > 1:
            return None, f"ambiguous .github/agents profiles for {target_agent!r} (matched by {rule})"
    return None, f"no profile in .github/agents matches {target_agent!r}"


def invoke_agent(task, args):
    profile, reason = resolve_profile(task["targetAgent"], list_profiles())
    if profile is None:
        return False, reason
    print(f"[    ] profile {profile['file'].relative_to(ROOT)} -> --agent {profile['id']}")
    root = get_project_root()
    message = (
        f"Project root: {root}\n"
        "Create the file(s) for this blackboard task, resolving `path` against the "
        "project root above. Task JSON:\n"
    )
    message += json.dumps({key: task[key] for key in PROMPT_KEYS}, indent=2)
    command = [
        args.copilot_bin,
        "-p", message,
        "-s",
        "--agent", profile["id"],
        "--no-ask-user",
        "--add-dir", str(ROOT),
        "--add-dir", str(root),
        "--allow-all-tools",
        "--allow-tool", args.allow_tool,
        "--allow-all-paths",
    ]
    print(f"[cmd ] {args.copilot_bin} -p <task> -s --agent {profile['id']} --no-ask-user --add-dir {ROOT} --allow-all-tools --allow-tool {args.allow_tool} --allow-all-paths")
    return run_agent(command, args.timeout, ROOT)


def run_architect(args, request):
    profile, reason = resolve_profile("agent-architect", list_profiles())
    if profile is None:
        return False, reason
    with telemetry.span("blackboard.architect", {"request.chars": len(request)}):
        message = ARCHITECT_PROMPT.format(request=request, runner=RUNNER_SCRIPT, project_root=get_project_root())
        command = [
            args.copilot_bin,
            "-p", message,
            "-s",
            "--agent", profile["id"],
            "--no-ask-user",
            "--add-dir", str(ROOT),
            "--allow-all-tools",
            "--allow-tool", args.allow_tool,
            "--allow-all-paths",
        ]
        print(f"[cmd ] {args.copilot_bin} -p <request> -s --agent {profile['id']} --no-ask-user --add-dir {ROOT} --allow-all-tools --allow-tool {args.allow_tool} --allow-all-paths")
        return run_agent(command, args.timeout, ROOT)


def run_translator(args, description, seed_path):
    profile, reason = resolve_profile("agent-spec-translator", list_profiles())
    if profile is None:
        return False, reason
    with telemetry.span("blackboard.translator", {"description": str(description), "seed": str(seed_path)}) as current:
        message = TRANSLATOR_PROMPT.format(description=description, seed=seed_path)
        command = [
            args.copilot_bin,
            "-p", message,
            "-s",
            "--agent", profile["id"],
            "--no-ask-user",
            "--add-dir", str(ROOT),
            "--allow-all-tools",
            "--allow-tool", args.allow_tool,
            "--allow-all-paths",
        ]
        print(f"[cmd ] {args.copilot_bin} -p <description> -s --agent {profile['id']} --no-ask-user --add-dir {ROOT} --allow-all-tools --allow-tool {args.allow_tool} --allow-all-paths")
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
        ok, reason = invoke_agent(task, args)
        if ok and task["stage"] != 0 and not (get_project_root() / task["path"]).exists():
            ok, reason = False, f"agent finished but {task['path']} was not created"
        if ok:
            ok, reason = run_verification(get_project_root(), args.verify, args.verify_scope, task, args.verify_timeout)
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
    parser = argparse.ArgumentParser(description="Blackboard orchestrator for VS Code / GitHub Copilot: same queue contract as runner.py, but agents are activated headlessly through the Copilot CLI using the custom agent profiles in .github/agents/.")
    parser.add_argument("--watch", action="store_true", help="poll the queue continuously")
    parser.add_argument("--interval", type=int, default=5, help="seconds between polls in watch mode")
    parser.add_argument("--timeout", type=int, default=900, help="seconds before a copilot run is aborted")
    parser.add_argument("--verify", choices=VERIFY_MODES, default="typecheck", help="post-task compile gate run in the project root: 'typecheck' (tsc --noEmit), 'build' (ng build), or 'none'")
    parser.add_argument("--verify-scope", choices=("task", "global"), default="task", help="'task' fails a task only when its own file has compile errors; 'global' fails on any compile error in the project")
    parser.add_argument("--verify-timeout", type=int, default=300, help="seconds before the verification command is aborted")
    parser.add_argument("--limit", type=int, default=0, help="stop after N tasks (0 = no limit)")
    parser.add_argument("--copilot-bin", default=DEFAULT_COPILOT_BIN, help="copilot binary (or COPILOT_BIN)")
    parser.add_argument("--allow-tool", default=DEFAULT_ALLOW_TOOL, help="comma-separated tools granted to workers")
    parser.add_argument("--output", metavar="DIR", help="directory where the Angular project is generated (default: projects/<seed name> inside this repo; external paths require external_directory access in the agent configs)")
    request_group = parser.add_mutually_exclusive_group()
    request_group.add_argument("--architect", metavar="REQUEST", help="invoke the architect agent with this inline build request before processing the queue")
    request_group.add_argument("--seed", metavar="FILE", help="path to a JSON file containing the product specification; the architect agent starts from it before processing the queue")
    request_group.add_argument("--translate", metavar="FILE", help="path to a human-readable application description (e.g. seed/001_description.md); runs the spec-translator agent to write seed/<n>_seed.json, then the architect")
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
    if shutil.which(args.copilot_bin) is None:
        print(f"[fatal] {args.copilot_bin!r} not found on PATH (install GitHub Copilot CLI or set COPILOT_BIN)")
        return 2
    try:
        if request is not None:
            print(f"[plan ] architect: {request[:80].replace(chr(10), ' ')}...")
            ok, reason = run_architect(args, request)
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
        ok, reason = verify_project(get_project_root(), args.verify, args.verify_timeout)
        if not ok:
            print(f"[fatal] {reason}")
            return 1
        print(f"[verify] project passes {args.verify}")
    print(f"[ok] processed {processed} task(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
