import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import app as app_module


def test_api_dashboard_requires_authentication():
    app_module.app.testing = True
    client = app_module.app.test_client()

    response = client.get('/api/dashboard')
    assert response.status_code == 401
    payload = response.get_json()
    assert payload['status'] == 'error'
    assert payload['msg'] == 'No autenticado'
