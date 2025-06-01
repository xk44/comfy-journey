import importlib.util
import pathlib
import sys

# Force use of local requests stub
requests_spec = importlib.util.spec_from_file_location(
    "requests", pathlib.Path(__file__).resolve().parent / "requests.py"
)
requests = importlib.util.module_from_spec(requests_spec)
requests_spec.loader.exec_module(requests)
sys.modules["requests"] = requests
import unittest
import json
from datetime import datetime

class ComfyUIBackendTester(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(ComfyUIBackendTester, self).__init__(*args, **kwargs)
        self.base_url = "https://ada1fbb6-a49a-40fa-a46e-2d13c2cd9eb8.preview.emergentagent.com/api"

    def setUp(self):
        print(f"\n🔍 Running test: {self._testMethodName}")

    def tearDown(self):
        """Basic tearDown that only logs completion."""
        pass

    def test_01_root_endpoint(self):
        """Test the root API endpoint"""
        response = requests.get(f"{self.base_url}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        payload = data.get("payload", {})
        self.assertIn("message", payload)
        self.assertEqual(payload["message"], "ComfyUI Frontend API")

    def test_02_parameter_mappings_crud(self):
        """Test parameter mappings CRUD operations"""
        # Create a parameter mapping
        create_data = {
            "code": "--test",
            "node_id": "test_node",
            "param_name": "test_param",
            "value_template": "{value}",
            "description": "Test parameter"
        }
        create_response = requests.post(f"{self.base_url}/parameters", json=create_data)
        self.assertEqual(create_response.status_code, 200)
        resp_json = create_response.json()
        self.assertTrue(resp_json.get("success"))
        param_data = resp_json.get("payload", {})
        self.assertIn("id", param_data)
        param_id = param_data["id"]

        # Get all parameter mappings
        get_all_response = requests.get(f"{self.base_url}/parameters")
        self.assertEqual(get_all_response.status_code, 200)
        mappings_resp = get_all_response.json()
        self.assertTrue(mappings_resp.get("success"))
        mappings = mappings_resp.get("payload", [])
        self.assertIsInstance(mappings, list)
        
        # Update the parameter mapping
        update_data = {
            "id": param_id,
            "code": "--test-updated",
            "node_id": "test_node",
            "param_name": "test_param",
            "value_template": "{value}",
            "description": "Updated test parameter"
        }
        update_response = requests.put(f"{self.base_url}/parameters/{param_id}", json=update_data)
        self.assertEqual(update_response.status_code, 200)
        updated_resp = update_response.json()
        self.assertTrue(updated_resp.get("success"))
        updated_param = updated_resp.get("payload", {})
        self.assertEqual(updated_param["description"], "Updated test parameter")
        
        # Delete the parameter mapping
        delete_response = requests.delete(f"{self.base_url}/parameters/{param_id}")
        self.assertEqual(delete_response.status_code, 200)
        delete_resp = delete_response.json()
        self.assertTrue(delete_resp.get("success"))
        delete_data = delete_resp.get("payload", {})
        self.assertEqual(delete_data["message"], "Parameter mapping deleted")

    def test_03_workflow_mappings_crud(self):
        """Test workflow mappings CRUD operations"""
        # Create a workflow mapping
        create_data = {
            "name": "Test Workflow",
            "description": "Test workflow mapping",
            "data": {
                "nodes": {
                    "1": {
                        "id": "1",
                        "type": "text_encoder",
                        "title": "Text Encoder",
                        "properties": {
                            "prompt": "A test prompt",
                            "width": 512,
                            "height": 512
                        }
                    }
                }
            }
        }
        create_response = requests.post(f"{self.base_url}/workflows", json=create_data)
        self.assertEqual(create_response.status_code, 200)
        resp_json = create_response.json()
        self.assertTrue(resp_json.get("success"))
        workflow_data = resp_json.get("payload", {})
        self.assertIn("id", workflow_data)
        workflow_id = workflow_data["id"]

        # Get all workflow mappings
        get_all_response = requests.get(f"{self.base_url}/workflows")
        self.assertEqual(get_all_response.status_code, 200)
        mappings_resp = get_all_response.json()
        self.assertTrue(mappings_resp.get("success"))
        mappings = mappings_resp.get("payload", [])
        self.assertIsInstance(mappings, list)
        
        # Update the workflow mapping
        update_data = {
            "id": workflow_id,
            "name": "Updated Test Workflow",
            "description": "Updated test workflow mapping",
            "data": workflow_data["data"]
        }
        update_response = requests.put(f"{self.base_url}/workflows/{workflow_id}", json=update_data)
        self.assertEqual(update_response.status_code, 200)
        updated_resp = update_response.json()
        self.assertTrue(updated_resp.get("success"))
        updated_workflow = updated_resp.get("payload", {})
        self.assertEqual(updated_workflow["description"], "Updated test workflow mapping")
        
        # Delete the workflow mapping
        delete_response = requests.delete(f"{self.base_url}/workflows/{workflow_id}")
        self.assertEqual(delete_response.status_code, 200)
        delete_resp = delete_response.json()
        self.assertTrue(delete_resp.get("success"))
        delete_data = delete_resp.get("payload", {})
        self.assertEqual(delete_data["message"], "Workflow mapping deleted")

    def test_04_action_mappings_crud(self):
        """Test action mappings CRUD operations"""
        create_data = {
            "name": "upscale",
            "workflow_id": "wf1",
            "description": "test action"
        }
        resp = requests.post(f"{self.base_url}/actions", json=create_data)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()["payload"]
        action_id = data["id"]

        get_resp = requests.get(f"{self.base_url}/actions")
        self.assertEqual(get_resp.status_code, 200)
        self.assertIsInstance(get_resp.json()["payload"], list)

        update_data = {
            "id": action_id,
            "name": "upscale2",
            "workflow_id": "wf1",
            "description": "updated"
        }
        up_resp = requests.put(f"{self.base_url}/actions/{action_id}", json=update_data)
        self.assertEqual(up_resp.status_code, 200)
        self.assertEqual(up_resp.json()["payload"]["name"], "upscale2")

        del_resp = requests.delete(f"{self.base_url}/actions/{action_id}")
        self.assertEqual(del_resp.status_code, 200)
        self.assertTrue(del_resp.json()["success"])

    def test_05_sample_workflows(self):
        """Test the sample workflows endpoint"""
        response = requests.get(f"{self.base_url}/sample-workflows")
        self.assertEqual(response.status_code, 200)
        resp_json = response.json()
        self.assertTrue(resp_json.get("success"))
        workflows = resp_json.get("payload", [])
        self.assertIsInstance(workflows, list)
        self.assertGreater(len(workflows), 0)
        
        # Check structure of sample workflows
        sample_workflow = workflows[0]
        self.assertIn("id", sample_workflow)
        self.assertIn("name", sample_workflow)
        self.assertIn("description", sample_workflow)
        self.assertIn("data", sample_workflow)
        self.assertIn("nodes", sample_workflow["data"])

    def test_06_proxy_prompt(self):
        """Test ComfyUI proxy prompt endpoint"""
        data = {"prompt": "test"}
        response = requests.post(f"{self.base_url}/comfyui/prompt", json=data)
        self.assertEqual(response.status_code, 200)
        resp_json = response.json()
        self.assertTrue(resp_json.get("success"))
        payload = resp_json.get("payload", {})
        self.assertIn("job_id", payload)

        # verify history and queue endpoints return lists
        hist = requests.get(f"{self.base_url}/comfyui/history")
        self.assertEqual(hist.status_code, 200)
        self.assertIsInstance(hist.json().get("payload"), list)

        queue = requests.get(f"{self.base_url}/comfyui/queue")
        self.assertEqual(queue.status_code, 200)
        self.assertIsInstance(queue.json().get("payload"), list)

def run_tests():
    suite = unittest.TestLoader().loadTestsFromTestCase(ComfyUIBackendTester)
    result = unittest.TextTestRunner(verbosity=2).run(suite)

    passed = result.testsRun - len(result.failures) - len(result.errors)
    print(f"\n📊 Tests passed: {passed}/{result.testsRun}")

    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(run_tests())
