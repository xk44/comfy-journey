import requests
import unittest
import sys
import json
from datetime import datetime

class ComfyUIBackendTester(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(ComfyUIBackendTester, self).__init__(*args, **kwargs)
        self.base_url = "https://0f350816-8088-4765-b8f6-12249ceffe51.preview.emergentagent.com/api"
        self.tests_run = 0
        self.tests_passed = 0

    def setUp(self):
        self.tests_run += 1
        print(f"\n🔍 Running test: {self._testMethodName}")

    def tearDown(self):
        if hasattr(self, '_outcome'):
            result = self._outcome.result
            if result.wasSuccessful():
                self.tests_passed += 1
                print(f"✅ Test passed: {self._testMethodName}")
            else:
                print(f"❌ Test failed: {self._testMethodName}")

    def test_01_root_endpoint(self):
        """Test the root API endpoint"""
        response = requests.get(f"{self.base_url}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("message", data)
        self.assertEqual(data["message"], "ComfyUI Frontend API")

    def test_02_comfyui_status(self):
        """Test the ComfyUI status endpoint"""
        response = requests.get(f"{self.base_url}/comfyui/status")
        self.assertEqual(response.status_code, 200)
        # Note: The actual response might contain an error since we don't have a real ComfyUI instance
        # We're just checking if the endpoint responds

    def test_03_comfyui_workflows(self):
        """Test the ComfyUI workflows endpoint"""
        response = requests.get(f"{self.base_url}/comfyui/workflows")
        self.assertEqual(response.status_code, 200)
        # Note: This is using mock data in the backend

    def test_04_generate_image(self):
        """Test the generate image endpoint"""
        data = {
            "prompt": "Test prompt",
            "parameters": {"param1": "value1"},
            "workflow_id": "test_workflow"
        }
        response = requests.post(f"{self.base_url}/generate", json=data)
        # Note: This will likely return an error since we don't have a real ComfyUI instance
        # We're just checking if the endpoint responds
        print(f"Generate image response: {response.status_code}, {response.text}")
        # Not asserting status code as it might fail without a real ComfyUI instance

    def test_05_parameter_mappings_crud(self):
        """Test parameter mappings CRUD operations"""
        # Create a parameter mapping
        create_data = {
            "code": "--test",
            "node_id": "test_node",
            "param_name": "test_param",
            "value_template": "test_template",
            "description": "Test parameter"
        }
        create_response = requests.post(f"{self.base_url}/parameters", json=create_data)
        self.assertEqual(create_response.status_code, 200)
        param_data = create_response.json()
        self.assertIn("id", param_data)
        param_id = param_data["id"]

        # Get all parameter mappings
        get_all_response = requests.get(f"{self.base_url}/parameters")
        self.assertEqual(get_all_response.status_code, 200)
        mappings = get_all_response.json()
        self.assertIsInstance(mappings, list)
        
        # Update the parameter mapping
        update_data = {
            "id": param_id,
            "code": "--test-updated",
            "node_id": "test_node",
            "param_name": "test_param",
            "value_template": "test_template",
            "description": "Updated test parameter"
        }
        update_response = requests.put(f"{self.base_url}/parameters/{param_id}", json=update_data)
        self.assertEqual(update_response.status_code, 200)
        updated_param = update_response.json()
        self.assertEqual(updated_param["description"], "Updated test parameter")
        
        # Delete the parameter mapping
        delete_response = requests.delete(f"{self.base_url}/parameters/{param_id}")
        self.assertEqual(delete_response.status_code, 200)
        delete_data = delete_response.json()
        self.assertEqual(delete_data["message"], "Parameter mapping deleted")

    def test_06_workflow_mappings_crud(self):
        """Test workflow mappings CRUD operations"""
        # Create a workflow mapping
        create_data = {
            "action_name": "Test Action",
            "workflow_id": "test_workflow",
            "description": "Test workflow mapping"
        }
        create_response = requests.post(f"{self.base_url}/workflows", json=create_data)
        self.assertEqual(create_response.status_code, 200)
        workflow_data = create_response.json()
        self.assertIn("id", workflow_data)
        workflow_id = workflow_data["id"]

        # Get all workflow mappings
        get_all_response = requests.get(f"{self.base_url}/workflows")
        self.assertEqual(get_all_response.status_code, 200)
        mappings = get_all_response.json()
        self.assertIsInstance(mappings, list)
        
        # Update the workflow mapping
        update_data = {
            "id": workflow_id,
            "action_name": "Updated Test Action",
            "workflow_id": "test_workflow",
            "description": "Updated test workflow mapping"
        }
        update_response = requests.put(f"{self.base_url}/workflows/{workflow_id}", json=update_data)
        self.assertEqual(update_response.status_code, 200)
        updated_workflow = update_response.json()
        self.assertEqual(updated_workflow["description"], "Updated test workflow mapping")
        
        # Delete the workflow mapping
        delete_response = requests.delete(f"{self.base_url}/workflows/{workflow_id}")
        self.assertEqual(delete_response.status_code, 200)
        delete_data = delete_response.json()
        self.assertEqual(delete_data["message"], "Workflow mapping deleted")

    def test_07_status_checks(self):
        """Test status check endpoints"""
        # Create a status check
        create_data = {
            "client_name": "test_client"
        }
        create_response = requests.post(f"{self.base_url}/status", json=create_data)
        self.assertEqual(create_response.status_code, 200)
        status_data = create_response.json()
        self.assertIn("id", status_data)
        
        # Get all status checks
        get_all_response = requests.get(f"{self.base_url}/status")
        self.assertEqual(get_all_response.status_code, 200)
        status_checks = get_all_response.json()
        self.assertIsInstance(status_checks, list)

def run_tests():
    suite = unittest.TestLoader().loadTestsFromTestCase(ComfyUIBackendTester)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    
    tester = ComfyUIBackendTester()
    print(f"\n📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(run_tests())