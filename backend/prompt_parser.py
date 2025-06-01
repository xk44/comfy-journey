import re
import shlex
from typing import Tuple, Dict, List, Any

# Pattern used for stripping shortcode tokens from a prompt string
SHORTCODE_PATTERN = re.compile(
    r"--(?P<key>\w+)(?:[=\s]+(?P<value>(\"[^\"]*\"|'[^']*'|[^-]+)))?"
)


def parse_prompt(prompt: str) -> Tuple[str, Dict[str, str]]:
    """Parse a prompt and extract shortcode parameters."""

    # Tokens may appear as ``--key value`` or ``--key=value``. Values can be
    # quoted with single or double quotes. Returns the cleaned prompt without
    # shortcodes and a dictionary mapping parameter keys to values.
    params: Dict[str, str] = {}
    remaining: List[str] = []

    tokens = shlex.split(prompt)
    i = 0
    while i < len(tokens):
        token = tokens[i]
        if token.startswith("--"):
            if "=" in token:
                key, value = token[2:].split("=", 1)
            else:
                key = token[2:]
                value = None
                if i + 1 < len(tokens) and not tokens[i + 1].startswith("--"):
                    i += 1
                    value = tokens[i]
            if value is None:
                value = "true"
            value = value.strip()
            if (
                (value.startswith('"') and value.endswith('"'))
                or (value.startswith("'") and value.endswith("'"))
            ):
                value = value[1:-1]
            params[key] = value
        else:
            remaining.append(token)
        i += 1

    clean_prompt = " ".join(remaining).strip()
    clean_prompt = SHORTCODE_PATTERN.sub("", clean_prompt).strip()
    return clean_prompt, params


def tokens_to_patch(
    tokens: Dict[str, str], mappings: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """Translate parsed tokens into JSON patch operations.

    Each mapping defines a ``code`` like ``--ar`` and the target node/parameter in
    a workflow. ``value_template`` can be used to format the value before it is
    inserted in the patch operation.
    """
    patch_ops: List[Dict[str, Any]] = []
    mapping_lookup = {m["code"].lstrip("-"): m for m in mappings}
    for code, value in tokens.items():
        mapping = mapping_lookup.get(code)
        if not mapping:
            continue
        template = mapping.get("value_template", "{value}")
        patch_ops.append(
            {
                "op": "replace",
                "path": f"/nodes/{mapping['node_id']}/properties/{mapping['param_name']}",
                "value": template.format(value=value),
            }
        )
    return patch_ops
