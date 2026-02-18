from claimlens.schemas.health import HealthResponse


def test_health_response_schema():
    resp = HealthResponse()
    assert resp.status == "ok"
    assert resp.service == "claimlens"
    assert resp.version == "0.1.0"
