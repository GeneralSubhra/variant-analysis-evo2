import sys
import modal

evo2_image=(
    modal.Image.from_registry(
        "nvidia/cuda:12.4.0-devel-ubuntu22.04",add_python="3.12"
    )
    .apt_install(
        ["build-essential",
         "cmake",
         "ninja-build",
         "git",
         "libcudnn8",
         "libcudnn8-dev",
         "gcc",
         "g++"]
    )
    .env({
        "CC":"/usr/bin/gcc",
        "CXX":"/usr/bin/g++",
        
    })
    .run_commands("git clone https://github.com/arcinstitute/evo2 && cd evo2 && pip install -e .")
    .pip_install_from_requirements("requirements.txt")
)
app = modal.App("variant-analysis-evo2",
                image=evo2_image)

@app.function(gpu="H100")
def test():
    print("TESTING")

@app.local_entrypoint()
def main():
    test.remote()

