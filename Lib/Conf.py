
import os
import uuid
import tempfile
import tornado.process
from DIRAC import S_OK, S_ERROR, gConfig
from DIRAC.Core.Security import Locations, X509Chain, X509CRL

BASECS = "/WebApp"

def getCSValue( opt, defValue = None ):
  return gConfig.getValue( "%s/%s" % ( BASECS, opt ), defValue )

def getCSSections( opt ):
  return gConfig.getSections( "%s/%s" % ( BASECS, opt ) )

def getCSOptions( opt ):
  return gConfig.getOptions( "%s/%s" % ( BASECS, opt ) )
  
def getCSOptionsDict( opt ):
  return gConfig.getOptionsDict( "%s/%s" % ( BASECS, opt ) )

def getTitle():
  defVal = gConfig.getValue( "/DIRAC/Configuration/Name", gConfig.getValue( "/DIRAC/Setup" ) )
  return "%s - DIRAC" % gConfig.getValue( "%s/Title" % BASECS, defVal )

def devMode():
  return getCSValue( "DevelopMode", True )

def rootURL():
  return getCSValue( "RootURL", "/DIRAC" )

def balancer():
  b = getCSValue( "Balancer", "" ).lower()
  if b in ( "", "none" ):
      return ""
  return b

def numProcesses():
  return getCSValue( "NumProcesses", 1 )

def HTTPS():
  if balancer():
    return False
  return getCSValue( "HTTPS/Enabled", True )

def HTTPPort():
  if balancer():
    default = 8000
  else:
    default = 8080
  procAdd = tornado.process.task_id() or 0
  return getCSValue( "HTTP/Port", default ) + procAdd

def HTTPSPort():
  return getCSValue( "HTTPS/Port", 8443 )

def HTTPSCert():
  cert = Locations.getHostCertificateAndKeyLocation()
  if cert:
    cert = cert[0]
  else:
    cert = "/opt/dirac/etc/grid-security/hostcert.pem"
  return getCSValue( "HTTPS/Cert", cert )

def HTTPSKey():
  key = Locations.getHostCertificateAndKeyLocation()
  if key:
    key = key[1]
  else:
    key = "/opt/dirac/etc/grid-security/hostkey.pem"
  return getCSValue( "HTTPS/Key", key )

def setup():
  return gConfig.getValue( "/DIRAC/Setup" )

def cookieSecret():
  # TODO: Store the secret somewhere
  return gConfig.getValue( "CookieSecret", uuid.getnode() )

def generateCAFile():
  """
  Generate a single CA file with all the PEMs
  """
  caDir = Locations.getCAsLocation()
  for fn in ( os.path.join( os.path.dirname( caDir ), "cas.pem" ),
              os.path.join( os.path.dirname( HTTPSCert() ), "cas.pem" ),
              False ):
    if not fn:
      fn = tempfile.mkstemp( prefix = "cas.", suffix = ".pem" )[1]
    try:
      fd = open( fn, "w" )
    except IOError:
      continue
    for caFile in os.listdir( caDir ):
      caFile = os.path.join( caDir, caFile )
      result = X509Chain.X509Chain.instanceFromFile( caFile )
      if not result[ 'OK' ]:
        continue
      chain = result[ 'Value' ]
      expired = chain.hasExpired()
      if not expired[ 'OK' ] or expired[ 'Value' ]:
        continue
      fd.write( chain.dumpAllToString()[ 'Value' ] )
    fd.close()
    return fn
  return False

def generateRevokedCertsFile():
  """
  Generate a single CA file with all the PEMs
  """
  caDir = Locations.getCAsLocation()
  for fn in ( os.path.join( os.path.dirname( caDir ), "allRevokedCerts.pem" ),
              os.path.join( os.path.dirname( HTTPSCert() ), "allRevokedCerts.pem" ),
              False ):
    if not fn:
      fn = tempfile.mkstemp( prefix = "allRevokedCerts", suffix = ".pem" )[1]
    try:
      fd = open( fn, "w" )
    except IOError:
      continue
    for caFile in os.listdir( caDir ):
      caFile = os.path.join( caDir, caFile )
      result = X509CRL.X509CRL.instanceFromFile( caFile )
      if not result[ 'OK' ]:
        continue
      chain = result[ 'Value' ]    
      fd.write( chain.dumpAllToString()[ 'Value' ] )
    fd.close()
    return fn
  return False

def getAuthSectionForHandler( route ):
  return "%s/Access/%s" % ( BASECS, route )

def getTheme():
  return getCSValue( "Theme", "desktop" )

def getIcon():
  return getCSValue("Icon","/static/core/img/icons/system/favicon.ico")

def SSLProrocol():
  return getCSValue( "SSLProtcol", "" )

def getStaticDirs():
  return getCSValue( "StaticDirs", [] )

def getLogo():
  return getCSValue("Logo","/static/core/img/icons/system/_logo_waiting.gif")

def getWelcome():
  res = {}
  res['show'] = getCSValue("WelcomePage/show", "True")
  res['style'] = getCSValue("WelcomePage/style", "")
  res['title'] = getCSValue("WelcomePage/title","Welcome to the EGI Workload Manager")
  res['text'] = getCSValue("WelcomePage/text",'<b>The EGI Workload manager is a service provided to the EGI community to efficiently manage and distribute computing workloads on the EGI infrastructure. The service is based on the <a target="_blank" href="http://diracgrid.org">DIRAC technology</a>. The delivery of the service is coordinated by the EGI Foundation and operated by IN2P3 on resources provided by CYFRONET. <a target="_blank" href="https://wiki.egi.eu/wiki/Workload_Manager">Discover more...</a>')
  res['visitor_title'] = getCSValue("WelcomePage/visitor_title","Access to the service")
  res['visitor_text'] = getCSValue("WelcomePage/visitor_text",'<p>If you are a new user, please request access via <a target="_blank" href="https://marketplace.egi.eu">the EGI marketplace</a>.</p>        <p>If you are a registered user, please follow the <a target="_blank" href="https://dirac.readthedocs.io/en/latest/">instructions</a> to access the full set of functionalities.</p>')
  return res

def getBackgroud():
  return getCSValue("BackgroundImage","/static/core/img/wallpapers/dirac_background_6.png")