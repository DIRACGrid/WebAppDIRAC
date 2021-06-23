import os
import subprocess

# BEFORE importing distutils, remove MANIFEST. distutils doesn't properly
# update it when the contents of directories change.
if os.path.exists('MANIFEST'): os.remove('MANIFEST')

from setuptools import Command, setup
# Note: distutils must be imported after setuptools
from distutils import log
from setuptools.command.develop import develop as _develop
from wheel.bdist_wheel import bdist_wheel as _bdist_wheel


class build_extjs_sources(Command):
    user_options = []

    def initialize_options(self):
        pass

    def finalize_options(self):
        pass

    def get_inputs(self):
        return []

    def get_outputs(self):
        return []

    def run(self):
        path = os.path.abspath(os.getcwd())
        cmd = [
            "docker",
            "run",
            "--rm",
            f"-v={path}:/shared",
            "-w=/shared",
            "diracgrid/dirac-distribution",
            "/dirac-webapp-compile.py",
            "-D=/shared/src",
            "-n=WebAppDIRAC",
        ]
        log.info('> %r', cmd)
        subprocess.check_call(cmd)


class develop(_develop):
    def run(self):
        self.run_command("build_extjs_sources")
        super().run()


class bdist_wheel(_bdist_wheel):
    def run(self):
        self.run_command("build_extjs_sources")
        super().run()


cmdclass = {
    "develop": develop,
    "bdist_wheel": bdist_wheel,
    "build_extjs_sources": build_extjs_sources,
}

setup(cmdclass=cmdclass)
