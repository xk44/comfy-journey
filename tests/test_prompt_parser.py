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

    def test_parse_quoted_and_equals(self):
        prompt = 'A cat --ar=1:1 --style "comic book"'
        clean, tokens = parse_prompt(prompt)
        self.assertEqual(clean, "A cat")
        self.assertEqual(tokens["ar"], "1:1")
        self.assertEqual(tokens["style"], "comic book")

if __name__ == "__main__":
    unittest.main()
