import os
import asyncio
import pytest
from backend.external_integrations.civitai import fetch_json

API_KEY = os.environ.get('CIVITAI_TEST_API_KEY')

@pytest.mark.skipif(not API_KEY, reason='CIVITAI_TEST_API_KEY not set')
def test_fetch_images_live():
    async def run():
        data = await fetch_json('/images', params={'limit':1}, api_key=API_KEY)
        assert data
    asyncio.run(run())

@pytest.mark.skipif(not API_KEY, reason='CIVITAI_TEST_API_KEY not set')
def test_fetch_model_live():
    async def run():
        data = await fetch_json('/models', params={'limit':1}, api_key=API_KEY)
        assert data
    asyncio.run(run())
