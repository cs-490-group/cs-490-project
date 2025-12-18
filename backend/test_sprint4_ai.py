import pytest
from unittest.mock import MagicMock, AsyncMock

import importlib

from mongo.AI_dao import AIDAO
from schema.AI import AIGenerate


@pytest.mark.asyncio
async def test_ai_route_generate_calls_dao(monkeypatch):
    ai_route = importlib.import_module('routes.AI')
    monkeypatch.setattr(ai_route.ai_dao, 'generate_text', AsyncMock(return_value='ok'))

    req = AIGenerate(prompt='p', system_message='s')
    resp = await ai_route.generate_ai_test(req)

    ai_route.ai_dao.generate_text.assert_awaited_once_with('p', 's')
    assert resp == {'response': 'ok'}


def test_ai_dao_call_cohere_extracts_text():
    dao = AIDAO.__new__(AIDAO)
    dao.co = MagicMock()

    mock_resp = MagicMock()
    mock_resp.message.content = [MagicMock(text='hello')]
    dao.co.chat.return_value = mock_resp

    out = dao._call_cohere('p', 's')

    assert out == 'hello'


@pytest.mark.asyncio
async def test_ai_dao_generate_text_uses_executor(monkeypatch):
    from concurrent.futures import ThreadPoolExecutor

    dao = AIDAO.__new__(AIDAO)
    dao.co = MagicMock()
    dao.executor = ThreadPoolExecutor(max_workers=1)
    monkeypatch.setattr(dao, '_call_cohere', MagicMock(return_value='x'))

    out = await dao.generate_text('p', 's')
    assert out == 'x'
