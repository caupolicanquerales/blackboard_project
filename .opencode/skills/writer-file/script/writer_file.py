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
TRACK_REPEAT_PATTERN = re.compile(r"^repeat\(\s*(\d+)\s*,(.*)\)$", re.S)

REGION_TYPES = frozenset(
    {
        "banner",
        "nav",
        "outlet",
        "toast-host",
        "stat-tile",
        "progress-bar",
        "radial-gauge",
        "stepper",
        "card-list",
        "meter",
        "chart",
        "table",
        "form",
        "detail-panel",
        "list",
        "toolbar",
        "sidebar",
        "footer",
        "overlay",
        "empty-state",
        "custom",
    }
)
CHART_TYPES = frozenset(
    {
        "none",
        "radial-ring",
        "split-bar",
        "chevron-timeline",
        "line",
        "area",
        "bar",
        "horizontal-bar",
        "donut",
        "sparkline",
        "scatter",
        "heat-map",
        "bullet",
    }
)
NON_VISUAL_TYPES = frozenset({"outlet", "toast-host", "nav", "toolbar", "footer", "overlay"})
CHART_NONE_ALLOWED_TYPES = NON_VISUAL_TYPES | frozenset(
    {"stat-tile", "card-list", "list", "table", "form", "detail-panel", "empty-state", "custom", "banner"}
)
LAYOUT_TYPES = frozenset(
    {"stack-v", "stack-h", "grid", "split", "overlay", "scroll-v", "scroll-h", "tabs"}
)
WIDGET_GRID_KEYS = ("columns", "gap", "align")
THEME_KEYS = ("mode", "background", "accent", "headingStyle")


def is_non_empty_str(value):
    return isinstance(value, str) and bool(value.strip())


def split_top_level(value, separator=" "):
    parts = []
    current = []
    depth = 0
    for char in value:
        if char == "(":
            depth += 1
        elif char == ")":
            depth = depth - 1 if depth > 0 else 0
        if depth == 0 and ((separator == " " and char.isspace()) or (separator == "," and char == ",")):
            if current:
                parts.append("".join(current))
                current = []
            continue
        current.append(char)
    if current:
        parts.append("".join(current))
    return [part for part in parts if part.strip()]


def count_css_tracks(value):
    total = 0
    for token in split_top_level(value):
        match = TRACK_REPEAT_PATTERN.match(token.strip())
        if match:
            count = int(match.group(1))
            inner = sum(count_css_tracks(arg) for arg in split_top_level(match.group(2), ","))
            total += count * inner if inner else count
        else:
            total += 1
    return total


def parse_grid_areas(areas):
    rows = AREAS_ROW_PATTERN.findall(areas)
    if not rows:
        return None, None, 'must be a quoted grid-template-areas string (e.g. "header" "main")'
    expected_columns = None
    tokens = set()
    parsed_rows = []
    for row in rows:
        cells = row.split()
        if not cells:
            return None, None, "has an empty grid-area row"
        if expected_columns is None:
            expected_columns = len(cells)
        elif len(cells) != expected_columns:
            return None, None, f"rows must have an equal number of areas (expected {expected_columns}, got {len(cells)})"
        tokens.update(cells)
        parsed_rows.append(cells)
    return parsed_rows, tokens, None


def rectangular_area_violation(matrix):
    positions = {}
    for row_index, row in enumerate(matrix):
        for column_index, cell in enumerate(row):
            positions.setdefault(cell.strip(), []).append((row_index, column_index))
    for name, cells in positions.items():
        row_indexes = {row for row, _ in cells}
        column_indexes = {column for _, column in cells}
        row_min, row_max = min(row_indexes), max(row_indexes)
        column_min, column_max = min(column_indexes), max(column_indexes)
        if len(cells) != (row_max - row_min + 1) * (column_max - column_min + 1):
            return name
        for row in range(row_min, row_max + 1):
            for column in range(column_min, column_max + 1):
                if matrix[row][column].strip() != name:
                    return name
    return None


def validate_matrix(matrix, columns, rows, area_rows, area_names, label):
    if not isinstance(matrix, list) or not matrix:
        return f"{label}.matrix must be a non-empty list of rows"
    widths = []
    for row_index, row in enumerate(matrix):
        if not isinstance(row, list) or not row:
            return f"{label}.matrix[{row_index}] must be a non-empty list"
        if not all(isinstance(cell, str) and cell.strip() for cell in row):
            return f"{label}.matrix[{row_index}] cells must be non-empty strings"
        widths.append(len(row))
    if len(set(widths)) != 1:
        return f"{label}.matrix rows must all have equal length (found widths {sorted(set(widths))})"
    height = len(matrix)
    width = widths[0]
    normalized = [[cell.strip() for cell in row] for row in matrix]
    if len(area_rows) != height:
        return f"{label}.matrix has {height} row(s) but {label}.areas declares {len(area_rows)} row(s); matrix and areas must encode the same map"
    for index, area_row in enumerate(area_rows):
        if area_row != normalized[index]:
            return (
                f"{label}.matrix row {index} must equal {label}.areas row {index} "
                f"(expected {' '.join(normalized[index])!r}, got {' '.join(area_row)!r})"
            )
    column_tracks = count_css_tracks(columns)
    if column_tracks != width:
        return f"{label}.columns declares {column_tracks} track(s) but {label}.matrix is {width} column(s) wide; rebuild columns/rows/areas/matrix from one matrix"
    if rows is not None:
        row_tracks = count_css_tracks(rows)
        if row_tracks != height:
            return f"{label}.rows declares {row_tracks} track(s) but {label}.matrix has {height} row(s); rebuild columns/rows/areas/matrix from one matrix"
    cell_tokens = {cell for row in normalized for cell in row}
    undeclared = cell_tokens - set(area_names)
    if undeclared:
        return f"{label}.matrix contains cell(s) without a declared region (undeclared areas: {', '.join(sorted(undeclared))})"
    missing = set(area_names) - cell_tokens
    if missing:
        return f"{label}.matrix must place every declared region area (missing: {', '.join(sorted(missing))})"
    violation = rectangular_area_violation(normalized)
    if violation:
        return f"{label}.matrix area '{violation}' must occupy exactly one solid rectangle (contiguous rows x contiguous columns)"
    return None


def validate_region_spec(region, label):
    for key in ("name", "area", "content"):
        if not is_non_empty_str(region.get(key)):
            return f"{label}.{key} must be a non-empty string"
    region_type = region.get("type")
    if region_type not in REGION_TYPES:
        return f"{label}.type must be one of {sorted(REGION_TYPES)} (got {region_type!r})"
    chart = region.get("chart")
    if chart not in CHART_TYPES:
        return f"{label}.chart must be one of {sorted(CHART_TYPES)} (got {chart!r})"
    if chart == "none" and region_type not in CHART_NONE_ALLOWED_TYPES:
        return f"{label}.chart 'none' is not allowed for type {region_type!r}; pick the matching chart representation"
    layout = region.get("layout")
    if layout not in LAYOUT_TYPES:
        return f"{label}.layout must be one of {sorted(LAYOUT_TYPES)} (got {layout!r})"
    if "elements:" not in region["content"].lower():
        return f"{label}.content must be a structured spec including an 'elements:' facet (got {region['content']!r})"
    return None


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
    area_names = []
    for region_index, region in enumerate(regions):
        if not isinstance(region, dict):
            return f"{label}.regions[{region_index}] must be an object"
        reason = validate_region_spec(region, f"{label}.regions[{region_index}]")
        if reason:
            return reason
        area_names.append(region["area"])
    duplicates = sorted({area for area in area_names if area_names.count(area) > 1})
    if duplicates:
        return f"{label}.regions area names must be unique (duplicated: {', '.join(duplicates)})"
    area_rows, tokens, reason = parse_grid_areas(grid["areas"])
    if reason:
        return f"{label}.areas {reason}"
    missing = set(area_names) - tokens
    if missing:
        return f"{label}.areas must declare every region area (missing: {', '.join(sorted(missing))})"
    reason = validate_matrix(grid.get("matrix"), grid["columns"], grid["rows"], area_rows, area_names, label)
    if reason:
        return reason
    responsive = grid.get("responsive")
    if not isinstance(responsive, list) or not responsive:
        return f"{label}.responsive must be a non-empty list"
    for index, entry in enumerate(responsive):
        entry_label = f"{label}.responsive[{index}]"
        if not isinstance(entry, dict):
            return f"{entry_label} must be an object"
        for key in ("name", "columns", "areas"):
            if not is_non_empty_str(entry.get(key)):
                return f"{entry_label}.{key} must be a non-empty string"
        if not (is_non_empty_str(entry.get("maxWidth")) or is_non_empty_str(entry.get("minWidth"))):
            return f"{entry_label} must declare maxWidth or minWidth"
        entry_rows, entry_tokens, reason = parse_grid_areas(entry["areas"])
        if reason:
            return f"{entry_label}.areas {reason}"
        missing = set(area_names) - entry_tokens
        if missing:
            return f"{entry_label}.areas must keep every base region (missing: {', '.join(sorted(missing))})"
        reason = validate_matrix(entry.get("matrix"), entry["columns"], None, entry_rows, area_names, entry_label)
        if reason:
            return reason
    return None


def validate_theme(theme):
    if not isinstance(theme, dict):
        return "global_requirements.theme must be an object with mode/background/accent/headingStyle"
    for key in THEME_KEYS:
        if not is_non_empty_str(theme.get(key)):
            return f"global_requirements.theme.{key} must be a non-empty string"
    return None


def validate_shared_ui(shared_ui):
    if not isinstance(shared_ui, list) or not shared_ui:
        return "global_requirements.shared_ui must be a non-empty list"
    for index, item in enumerate(shared_ui):
        label = f"global_requirements.shared_ui[{index}]"
        if not isinstance(item, dict):
            return f"{label} must be an object with name/purpose/type/chart/layout/grid/content/a11y"
        for key in ("name", "purpose", "content", "a11y"):
            if not is_non_empty_str(item.get(key)):
                return f"{label}.{key} must be a non-empty string"
        if item.get("type") not in REGION_TYPES:
            return f"{label}.type must be one of {sorted(REGION_TYPES)} (got {item.get('type')!r})"
        if item.get("chart") not in CHART_TYPES:
            return f"{label}.chart must be one of {sorted(CHART_TYPES)} (got {item.get('chart')!r})"
        if item.get("layout") not in LAYOUT_TYPES:
            return f"{label}.layout must be one of {sorted(LAYOUT_TYPES)} (got {item.get('layout')!r})"
        if "elements:" not in item["content"].lower():
            return f"{label}.content must be a structured spec including an 'elements:' facet"
        grid = item.get("grid")
        if not isinstance(grid, dict):
            return f"{label}.grid must be an object with columns/gap/align"
        for key in WIDGET_GRID_KEYS:
            if not is_non_empty_str(grid.get(key)):
                return f"{label}.grid.{key} must be a non-empty string"
    return None


def validate_theme(theme):
    if not isinstance(theme, dict):
        return "global_requirements.theme must be an object with mode/background/accent/headingStyle"
    for key in THEME_KEYS:
        if not is_non_empty_str(theme.get(key)):
            return f"global_requirements.theme.{key} must be a non-empty string"
    return None


def validate_shared_ui(shared_ui, paradigm):
    if not isinstance(shared_ui, list) or not shared_ui:
        return "global_requirements.shared_ui must be a non-empty list"
    for index, item in enumerate(shared_ui):
        label = f"global_requirements.shared_ui[{index}]"
        if not isinstance(item, dict):
            return f"{label} must be an object with name/purpose/type/content/a11y"
        for key in ("name", "purpose", "content", "a11y"):
            if not is_non_empty_str(item.get(key)):
                return f"{label}.{key} must be a non-empty string"
        # type may be flexible for mobile
        if item.get("type") not in REGION_TYPES and paradigm == "grid":
            return f"{label}.type must be one of {sorted(REGION_TYPES)} (got {item.get('type')!r})"
        if "elements:" not in item["content"].lower():
            return f"{label}.content must be a structured spec including an 'elements:' facet"
        if paradigm == "grid":
            grid = item.get("grid")
            if not isinstance(grid, dict):
                return f"{label}.grid must be an object with columns/gap/align"
            for key in WIDGET_GRID_KEYS:
                if not is_non_empty_str(grid.get(key)):
                    return f"{label}.grid.{key} must be a non-empty string"
        else:
            # For non-grid, require some layout spec
            has_layout = any(k in item for k in ("layoutSpec", "flex", "stack", "constraints"))
            if not has_layout:
                return f"{label} must have a layoutSpec/flex/stack/constraints for paradigm {paradigm}"
    return None


def validate_skills(skills):
    if skills is None:
        return None  # skills optional but encouraged
    if not isinstance(skills, list):
        return "skills must be a list of objects"
    for i, s in enumerate(skills):
        if not isinstance(s, dict):
            return f"skills[{i}] must be an object"
        if not is_non_empty_str(s.get("name")):
            return f"skills[{i}].name must be a non-empty string"
        if not is_non_empty_str(s.get("invocation")):
            return f"skills[{i}].invocation must be a non-empty string"
    return None


def validate_theme(theme):
    if not isinstance(theme, dict):
        return "global_requirements.theme must be an object with mode/background/accent/headingStyle"
    for key in THEME_KEYS:
        if not is_non_empty_str(theme.get(key)):
            return f"global_requirements.theme.{key} must be a non-empty string"
    return None


def validate_shared_ui(shared_ui, paradigm, layout_paradigm):
    if not isinstance(shared_ui, list) or not shared_ui:
        return "global_requirements.shared_ui must be a non-empty list"
    for index, item in enumerate(shared_ui):
        label = f"global_requirements.shared_ui[{index}]"
        if not isinstance(item, dict):
            return f"{label} must be an object with name/purpose/type/content/a11y/layoutSpec"
        for key in ("name", "purpose", "content", "a11y"):
            if not is_non_empty_str(item.get(key)):
                return f"{label}.{key} must be a non-empty string"
        if item.get("type") not in REGION_TYPES and layout_paradigm == "grid":
            return f"{label}.type must be one of {sorted(REGION_TYPES)} (got {item.get('type')!r})"
        if "elements:" not in item["content"].lower():
            return f"{label}.content must be a structured spec including an 'elements:' facet"
        layout_spec = item.get("layoutSpec")
        if not isinstance(layout_spec, dict):
            return f"{label}.layoutSpec must be an object"
        if layout_spec.get("paradigm") != layout_paradigm:
            return f"{label}.layoutSpec.paradigm must equal project.layoutParadigm ({layout_paradigm})"
        if layout_paradigm == "grid":
            if not isinstance(layout_spec.get("grid"), dict):
                return f"{label}.layoutSpec.grid required for grid paradigm"
        elif layout_paradigm == "flexbox":
            if not isinstance(layout_spec.get("flex"), dict):
                return f"{label}.layoutSpec.flex required for flexbox paradigm"
        elif layout_paradigm == "stack":
            if not isinstance(layout_spec.get("stack"), dict):
                return f"{label}.layoutSpec.stack required for stack paradigm"
        elif layout_paradigm == "constraints":
            if not isinstance(layout_spec.get("constraints"), dict):
                return f"{label}.layoutSpec.constraints required for constraints paradigm"
    return None


def validate_skills(skills):
    if not isinstance(skills, list) or not skills:
        return "skills must be a non-empty list with skill invocations"
    for i, s in enumerate(skills):
        if not isinstance(s, dict):
            return f"skills[{i}] must be an object"
        if not is_non_empty_str(s.get("name")):
            return f"skills[{i}].name must be a non-empty string"
        if not is_non_empty_str(s.get("invocation")):
            return f"skills[{i}].invocation must be a non-empty string"
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
    platform = project.get("platform") or "web"
    layout_paradigm = project.get("layoutParadigm") or ("grid" if platform == "web" else "flexbox")
    global_requirements = data.get("global_requirements")
    if not isinstance(global_requirements, dict):
        return "global_requirements must be an object"
    if not isinstance(global_requirements.get("layout"), str) or not global_requirements["layout"].strip():
        return "global_requirements.layout must be a non-empty string"
    reason = validate_theme(global_requirements.get("theme"))
    if reason:
        return reason
    # enforce layoutSpec wrapper
    layout_spec = global_requirements.get("layoutSpec")
    if not isinstance(layout_spec, dict):
        return "global_requirements.layoutSpec must be an object wrapper"
    if layout_spec.get("paradigm") != layout_paradigm:
        return f"global_requirements.layoutSpec.paradigm must equal project.layoutParadigm ({layout_paradigm})"
    if layout_paradigm == "grid":
        reason = validate_grid(layout_spec.get("grid"), "global_requirements.layoutSpec.grid")
        if reason:
            return reason
    elif layout_paradigm == "flexbox":
        if not isinstance(layout_spec.get("flex"), dict):
            return "global_requirements.layoutSpec.flex required for flexbox paradigm"
    elif layout_paradigm == "stack":
        if not isinstance(layout_spec.get("stack"), dict):
            return "global_requirements.layoutSpec.stack required for stack paradigm"
    elif layout_paradigm == "constraints":
        if not isinstance(layout_spec.get("constraints"), dict):
            return "global_requirements.layoutSpec.constraints required for constraints paradigm"
    # no top-level layout keys
    for forbidden in ("grid", "flex", "stack", "constraints"):
        if forbidden in global_requirements:
            return f"global_requirements.{forbidden} must be inside layoutSpec, not at top level"
    reason = validate_skills(data.get("skills"))
    if reason:
        return reason
    core_services = global_requirements.get("core_services")
    if not isinstance(core_services, list) or not all(isinstance(item, str) for item in core_services):
        return "global_requirements.core_services must be a list of strings"
    reason = validate_shared_ui(global_requirements.get("shared_ui"), layout_paradigm, layout_paradigm)
    if reason:
        return reason
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
        route = feature["route"]
        if platform == "web":
            if not route.startswith("/"):
                return f"features[{index}].route must start with '/' for web platform"
        else:  # mobile/native
            if route.startswith("/"):
                return f"features[{index}].route must be screen name without leading '/' for mobile platform"
            if not re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', route):
                return f"features[{index}].route must be kebab-case screen name for mobile platform (got {route!r})"
        # layoutSpec required
        f_layout = feature.get("layoutSpec")
        if not isinstance(f_layout, dict):
            return f"features[{index}].layoutSpec must be an object wrapper"
        if f_layout.get("paradigm") != layout_paradigm:
            return f"features[{index}].layoutSpec.paradigm must equal project.layoutParadigm"
        for forbidden in ("grid", "flex", "stack", "constraints"):
            if forbidden in feature:
                return f"features[{index}].{forbidden} must be inside layoutSpec"
        if layout_paradigm == "grid":
            reason = validate_grid(f_layout.get("grid"), f"features[{index}].layoutSpec.grid")
            if reason:
                return reason
        elif layout_paradigm == "flexbox":
            if not isinstance(f_layout.get("flex"), dict):
                return f"features[{index}].layoutSpec.flex required for flexbox paradigm"
        elif layout_paradigm == "stack":
            if not isinstance(f_layout.get("stack"), dict):
                return f"features[{index}].layoutSpec.stack required for stack paradigm"
        elif layout_paradigm == "constraints":
            if not isinstance(f_layout.get("constraints"), dict):
                return f"features[{index}].layoutSpec.constraints required for constraints paradigm"
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
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
