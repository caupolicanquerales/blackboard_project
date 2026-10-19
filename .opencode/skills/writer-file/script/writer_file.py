#!/usr/bin/env python3
import argparse
import json
import re
import sys
from pathlib import Path

EXIT_OK = 0
EXIT_INVALID = 1
EXIT_SOURCE = 2
EXIT_IO = 3
FIELD_PATTERN = re.compile(r"^[A-Za-z_$][A-Za-z0-9_$]*\s*:\s*.+$")
AREAS_ROW_PATTERN = re.compile(r'"([^"]*)"')


def is_non_empty_str(value):
    return isinstance(value, str) and bool(value.strip())


def parse_grid_areas(areas):
    rows = AREAS_ROW_PATTERN.findall(areas)
    if not rows:
        return None, "must be a quoted grid-template-areas string (e.g. \"header\" \"main\")"
    columns = None
    tokens = set()
    for row in rows:
        cells = row.split()
        if not cells:
            return None, "has an empty grid-area row"
        if columns is None:
            columns = len(cells)
        elif len(cells) != columns:
            return None, f"rows must have an equal number of areas (expected {columns}, got {len(cells)})"
        tokens.update(cells)
    return tokens, None


def validate_grid(grid, label):
    if not isinstance(grid, dict):
        return f"{label} must be an object"
    if grid.get("display") != "grid":
        return f'{label}.display must be "grid"'
    for key in ("columns", "rows", "gap", "areas"):
        if not is_non_empty_str(grid.get(key)):
            return f"{label}.{key} must be a non-empty string"
    regions = grid.get("regions")
    if not isinstance(regions, list) or not regions:
        return f"{label}.regions must be a non-empty list"
    area_names = set()
    for region_index, region in enumerate(regions):
        if not isinstance(region, dict):
            return f"{label}.regions[{region_index}] must be an object"
        for key in ("name", "area", "content"):
            if not is_non_empty_str(region.get(key)):
                return f"{label}.regions[{region_index}].{key} must be a non-empty string"
        area_names.add(region["area"])
    tokens, reason = parse_grid_areas(grid["areas"])
    if reason:
        return f"{label}.areas {reason}"
    missing = area_names - tokens
    if missing:
        return f"{label}.areas must declare every region area (missing: {', '.join(sorted(missing))})"
    responsive = grid.get("responsive")
    if not isinstance(responsive, list) or not responsive:
        return f"{label}.responsive must be a non-empty list"
    for index, entry in enumerate(responsive):
        if not isinstance(entry, dict):
            return f"{label}.responsive[{index}] must be an object"
        for key in ("name", "columns", "areas"):
            if not is_non_empty_str(entry.get(key)):
                return f"{label}.responsive[{index}].{key} must be a non-empty string"
        if not (is_non_empty_str(entry.get("maxWidth")) or is_non_empty_str(entry.get("minWidth"))):
            return f"{label}.responsive[{index}] must declare maxWidth or minWidth"
        _, reason = parse_grid_areas(entry["areas"])
        if reason:
            return f"{label}.responsive[{index}].areas {reason}"
    return None


def validate_seed(data):
    if not isinstance(data, dict):
        return "seed must be a JSON object"
    project = data.get("project")
    if not isinstance(project, dict):
        return "project must be an object"
    for key in ("name", "description", "target"):
        if not isinstance(project.get(key), str) or not project[key].strip():
            return f"project.{key} must be a non-empty string"
    global_requirements = data.get("global_requirements")
    if not isinstance(global_requirements, dict):
        return "global_requirements must be an object"
    if not isinstance(global_requirements.get("layout"), str) or not global_requirements["layout"].strip():
        return "global_requirements.layout must be a non-empty string"
    reason = validate_grid(global_requirements.get("grid"), "global_requirements.grid")
    if reason:
        return reason
    core_services = global_requirements.get("core_services")
    if not isinstance(core_services, list) or not all(isinstance(item, str) for item in core_services):
        return "global_requirements.core_services must be a list of strings"
    shared_ui = global_requirements.get("shared_ui")
    if not isinstance(shared_ui, list) or not all(isinstance(item, str) for item in shared_ui):
        return "global_requirements.shared_ui must be a list of strings"
    for item_index, item in enumerate(shared_ui):
        normalized = item.lower()
        if "grid:" not in normalized or "columns=" not in normalized:
            return (
                f"global_requirements.shared_ui[{item_index}] must include an explicit grid spec "
                "('grid: columns=...; gap=...; align=...')"
            )
    features = data.get("features")
    if not isinstance(features, list) or not features:
        return "features must be a non-empty list"
    for index, feature in enumerate(features):
        if not isinstance(feature, dict):
            return f"features[{index}] must be an object"
        for key in ("name", "route", "description"):
            value = feature.get(key)
            if not isinstance(value, str) or not value.strip():
                return f"features[{index}].{key} must be a non-empty string"
        if not feature["route"].startswith("/"):
            return f"features[{index}].route must start with '/'"
        reason = validate_grid(feature.get("grid"), f"features[{index}].grid")
        if reason:
            return reason
        entities = feature.get("entities")
        if not isinstance(entities, list) or not entities:
            return f"features[{index}].entities must be a non-empty list"
        for entity_index, entity in enumerate(entities):
            if not isinstance(entity, dict):
                return f"features[{index}].entities[{entity_index}] must be an object"
            name = entity.get("name")
            if not isinstance(name, str) or not name.strip():
                return f"features[{index}].entities[{entity_index}].name must be a non-empty string"
            fields = entity.get("fields")
            if not isinstance(fields, list) or not all(isinstance(item, str) for item in fields):
                return f"features[{index}].entities[{entity_index}].fields must be a list of strings"
            for field_index, field in enumerate(fields):
                if not FIELD_PATTERN.match(field):
                    return f"features[{index}].entities[{entity_index}].fields[{field_index}] must be formatted as 'name: type' (got {field!r})"
        actions = feature.get("actions")
        if actions is not None and (not isinstance(actions, list) or not all(isinstance(item, str) for item in actions)):
            return f"features[{index}].actions must be a list of strings when present"
    return None


def read_source(source):
    if source == "-":
        return sys.stdin.read(), None
    path = Path(source).expanduser()
    try:
        return path.read_text(encoding="utf-8"), None
    except OSError as exc:
        return None, f"cannot read source {path}: {exc}"


def write_target(target, payload):
    path = Path(target).expanduser()
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    except OSError as exc:
        return f"cannot write target {path}: {exc}"
    return None


def main():
    parser = argparse.ArgumentParser(description="Validate a translated JSON seed and write it into the seed folder.")
    parser.add_argument("--source", required=True, metavar="FILE", help="JSON file produced by the agent ('-' for stdin)")
    parser.add_argument("--target", required=True, metavar="FILE", help="destination seed file (e.g. seed/001_seed.json)")
    args = parser.parse_args()

    raw, reason = read_source(args.source)
    if reason:
        print(f"[writer-file] {reason}", file=sys.stderr)
        return EXIT_SOURCE

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"[writer-file] source is not valid JSON: {exc}", file=sys.stderr)
        return EXIT_INVALID

    if not isinstance(payload, dict):
        print("[writer-file] seed must be a JSON object", file=sys.stderr)
        return EXIT_INVALID

    reason = validate_seed(payload)
    if reason:
        print(f"[writer-file] invalid seed: {reason}", file=sys.stderr)
        return EXIT_INVALID

    reason = write_target(args.target, payload)
    if reason:
        print(f"[writer-file] {reason}", file=sys.stderr)
        return EXIT_IO

    print(f"[writer-file] wrote {args.target} ({payload['project']['name']}, {len(payload['features'])} feature(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
