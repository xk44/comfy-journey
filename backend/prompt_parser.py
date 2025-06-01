import re
from typing import Tuple, Dict, List, Any

SHORTCODE_PATTERN = re.compile(r"--(?P<key>\w+)(?:\s+(?P<value>[^-]+))?")


def parse_prompt(prompt: str) -> Tuple[str, Dict[str, str]]:
    """Parse a prompt string extracting shortcode parameters.

    Returns a tuple of (clean_prompt, params_dict).
    """
    params: Dict[str, str] = {}
    for match in SHORTCODE_PATTERN.finditer(prompt):
        key = match.group("key")
        value = match.group("value")
        if value is None:
            value = "true"
        else:
            value = value.strip()
        params[key] = value
    clean_prompt = SHORTCODE_PATTERN.sub("", prompt).strip()
    return clean_prompt, params


def tokens_to_patch(tokens: Dict[str, str], mappings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Convert parsed tokens to JSON patch operations using parameter mappings.

    Each mapping dict should contain 'code', 'node_id', 'param_name', and optional
    'value_template'.
    """
    patch_ops: List[Dict[str, Any]] = []
    mapping_lookup = {m["code"].lstrip("-"): m for m in mappings}
    for code, value in tokens.items():
        mapping = mapping_lookup.get(code)
        if not mapping:
            continue
        template = mapping.get("value_template", "{value}")
        patch_ops.append({
            "op": "replace",
            "path": f"/nodes/{mapping['node_id']}/properties/{mapping['param_name']}",
            "value": template.format(value=value),
        })
    return patch_ops
