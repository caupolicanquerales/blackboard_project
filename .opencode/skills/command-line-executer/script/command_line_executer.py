#!/usr/bin/env python3
import argparse
import subprocess
import sys
from pathlib import Path

EXIT_COMMAND_FAILED = 1
EXIT_MISSING_EXPECTED_FILE = 2
EXIT_RUNTIME_ERROR = 3


def run_command(command, cwd, timeout, quiet):
    print(f"[command-line-executer] $ {command}")
    if cwd:
        print(f"[command-line-executer] cwd: {cwd}")
    result = subprocess.run(
        command,
        shell=True,
        cwd=cwd,
        timeout=timeout,
        stdout=subprocess.DEVNULL if quiet else None,
        stderr=subprocess.DEVNULL if quiet else None,
        text=True,
    )
    if result.returncode == 0:
        print("[command-line-executer] ok")
    else:
        print(f"[command-line-executer] failed (exit {result.returncode})", file=sys.stderr)
    return result.returncode


def missing_expected_files(expected_files, cwd):
    missing = []
    for name in expected_files:
        target = Path(name)
        if not target.is_absolute() and cwd:
            target = Path(cwd) / target
        if not target.is_file():
            missing.append(str(target))
    return missing


def main():
    parser = argparse.ArgumentParser(
        description="Execute a shell command and verify expected output files.",
        epilog="Exit codes: 0 ok, 1 command failed, 2 expected file missing, 3 runtime error.",
    )
    parser.add_argument("command", help="Shell command to execute")
    parser.add_argument("--cwd", help="Working directory for the command")
    parser.add_argument("--timeout", type=int, default=300, help="Timeout in seconds (default: 300)")
    parser.add_argument(
        "--expect-file",
        action="append",
        default=[],
        dest="expect_files",
        help="File that must exist after a successful run (repeatable)",
    )
    parser.add_argument("--quiet", action="store_true", help="Suppress command output")
    args = parser.parse_args()

    if args.cwd and not Path(args.cwd).is_dir():
        print(f"[command-line-executer] cwd does not exist: {args.cwd}", file=sys.stderr)
        sys.exit(1)

    try:
        code = run_command(args.command, args.cwd, args.timeout, args.quiet)
    except subprocess.TimeoutExpired:
        print(f"[command-line-executer] timeout after {args.timeout}s", file=sys.stderr)
        sys.exit(EXIT_RUNTIME_ERROR)
    except Exception as exc:
        print(f"[command-line-executer] error: {exc}", file=sys.stderr)
        sys.exit(EXIT_RUNTIME_ERROR)

    if code != 0:
        sys.exit(EXIT_COMMAND_FAILED)

    missing = missing_expected_files(args.expect_files, args.cwd)
    if missing:
        print(f"[command-line-executer] missing expected file(s): {', '.join(missing)}", file=sys.stderr)
        sys.exit(EXIT_MISSING_EXPECTED_FILE)

    sys.exit(0)


if __name__ == "__main__":
    main()
