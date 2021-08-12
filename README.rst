DIRAC WebApp
============

.. image:: https://badge.fury.io/py/WebAppDIRAC.svg
    :target: https://badge.fury.io/py/WebAppDIRAC

Web app extension for the `DIRAC project <https://github.com/DIRACGrid/DIRAC>`_. WebAppDIRAC is written using extjs 6.2.0 and python 3.

Status master branch (stable):

.. image:: https://github.com/DIRACGrid/WebAppDIRAC/workflows/Basic%20tests/badge.svg?branch=rel-v4r3
   :target: https://github.com/DIRACGrid/WebAppDIRAC/actions?query=workflow%3A%22Basic+tests%22+branch%3Arel-v4r3
   :alt: Basic Tests Status

Status integration branch (devel):

.. image:: https://github.com/DIRACGrid/WebAppDIRAC/workflows/Basic%20tests/badge.svg?branch=integration
   :target: https://github.com/DIRACGrid/WebAppDIRAC/actions?query=workflow%3A%22Basic+tests%22+branch%3Aintegration
   :alt: Basic Tests Status



Install
-------

Instructions for installing WebAppDIRAC are described `here <https://github.com/DIRACGrid/DIRAC/blob/integration/docs/source/AdministratorGuide/ServerInstallations/InstallingWebAppDIRAC.rst#installing-webappdirac>`_.

Configure
---------

To configure web portal you need create **/WebApp** section in DIRAC configuration::

  WebApp
  {
    # Specifies the caption in the title in the browser. By default, the name of the configuration is taken.
    # Title = "My title"

    # To use some balancer(e.g.: nginx) assign a balaser name here. By default, the portal is launched without a balancer.
    # Balancer = None

    # If a balancer is defined, this option determines the number of processes that will run in parallel on different ports. By default: 1.
    # NumProcesses = 1

    # If you want to run web portal in "development mode", by default, this is disabled.
    # DevelopMode = True

    # Change the root of the request path to the server(default: /DIRAC). It is not recommended to change.
    # RootURL = /DIRAC

    # To configure https protocol. It is not recommended to change.
    # If you use balancer this options will ignore and will use HTTP options.
    # HTTPS
    # {
      # To disable https protocol delete value. It is not recommended to change.
      # Enabled = True
      # To set another port(default: 8443).
      # Port = 8443
      # Host certificate pem
      # Cert = /opt/dirac/etc/grid-security/hostcert.pem
      # Host key pem
      # Cert = /opt/dirac/etc/grid-security/hostkey.pem
    # }

    # To configure http protocol. It is not recommended to change.
    # HTTP
    # {
      # To set another port. By default 8000 if you use balancer and 8080 if not.
      # Port = 8000
    # }

    # To set secret for security cookies
    # CookieSecret = mysecret

    # Next section contain access rights.
    # Access
    # {
    #   upload = TruestedHost
    # }

    # Path to favicon icon. It is not recommended to change.
    # Icon = /static/core/img/icons/system/favicon.ico

    # SSL protocol to use.
    # SSLProtocol =

    # Set static directories.
    # DefaultStaticDirs = None
  }
