from pathlib import Path
from setuptools import find_packages, setup

base_dir = Path(__file__).parent
version_ns = {}

with open(base_dir / "c4web" / "__init__.py", "r", encoding="utf-8") as f:
    exec(f.read(), version_ns)

requirements_path = base_dir / "requirements.txt"
install_requires = []
if requirements_path.exists():
    install_requires = [
        line.strip()
        for line in requirements_path.read_text(encoding="utf-8").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]

setup(
    name="c4web",
    version=version_ns["__version__"],
    description="Connect4systems Arabic RTL website app for Frappe",
    author="Connect4systems",
    author_email="info@connect4systems.com",
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires,
)
