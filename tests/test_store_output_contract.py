"""Regression guard: MGU Store accepts MGU_OUT or a declared output, not both."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
component = json.loads((root / "mgu-repo.json").read_text(encoding="utf-8"))["components"][0]
build = component["build"]
builder = (root / build["python"]).read_text(encoding="utf-8")
assert build["sdk"] == "oap-sdk"
assert "output" not in build, "MGU Store would copy the artifact after the builder already placed it in MGU_OUT"
assert "MGU_OUT" in builder
assert "tmpname.replace(output)" in builder
print("MGU Store output contract: only MGU_OUT is used")
