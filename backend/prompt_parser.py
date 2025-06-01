import shlex
from typing import Tuple, Dict, List, Any


def parse_prompt(prompt: str) -> Tuple[str, Dict[str, str]]:
    """Parse a prompt string extracting shortcode parameters.

    This implementation supports tokens in the form ``--key value`` or
    ``--key=value``. Values may be quoted with single or double quotes.

    Returns a tuple ``(clean_prompt, params_dict)``.
    """

    params: Dict[str, str] = {}
    remaining_tokens: List[str] = []

    tokens = shlex.split(prompt)
    i = 0
    while i < len(tokens):
        token = tokens[i]
        if token.startswith("--"):
            key_val = token[2:]
            if "=" in key_val:
                key, value = key_val.split("=", 1)
            else:
                key = key_val
                value = None
                if i + 1 < len(tokens) and not tokens[i + 1].startswith("--"):
                    i += 1
                    value = tokens[i]
            if value is None:
                value = "true"
            params[key] = value
        else:
            remaining_tokens.append(token)
        i += 1

    clean_prompt = " ".join(remaining_tokens)
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
