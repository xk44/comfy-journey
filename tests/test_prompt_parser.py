import unittest
from backend.prompt_parser import parse_prompt, tokens_to_patch

class PromptParserTests(unittest.TestCase):
    def test_parse_prompt_and_patch(self):
        prompt = "A castle on a hill --ar 16:9 --style vivid"
        clean, tokens = parse_prompt(prompt)
        self.assertEqual(clean, "A castle on a hill")
        self.assertEqual(tokens["ar"], "16:9")
        self.assertEqual(tokens["style"], "vivid")

        mappings = [
            {"code": "--ar", "node_id": "1", "param_name": "aspect_ratio"},
            {"code": "--style", "node_id": "2", "param_name": "style"},
        ]
        patches = tokens_to_patch(tokens, mappings)
        self.assertEqual(len(patches), 2)
        self.assertEqual(patches[0]["path"], "/nodes/1/properties/aspect_ratio")
        self.assertEqual(patches[0]["value"], "16:9")

    def test_custom_path_and_op(self):
        tokens = {"scale": "2"}
        mappings = [
            {
                "code": "--scale",
                "node_id": "10",
                "param_name": "scale",
                "path_template": "/nodes/{node_id}/inputs/{param_name}",
                "op": "add",
            }
        ]
        patches = tokens_to_patch(tokens, mappings)
        self.assertEqual(patches, [
            {
                "op": "add",
                "path": "/nodes/10/inputs/scale",
                "value": "2",
            }
        ])

    def test_parse_quoted_and_equals(self):
        prompt = 'A cat --ar=1:1 --style "comic book"'
        clean, tokens = parse_prompt(prompt)
        self.assertEqual(clean, "A cat")
        self.assertEqual(tokens["ar"], "1:1")
        self.assertEqual(tokens["style"], "comic book")
        
    def test_parse_prompt_with_quotes(self):
        prompt = 'A cat --style "very cool" --ar 1:1'
        clean, tokens = parse_prompt(prompt)
        self.assertEqual(clean, 'A cat')
        self.assertEqual(tokens['style'], 'very cool')
        self.assertEqual(tokens['ar'], '1:1')

if __name__ == "__main__":
    unittest.main()
