
import os
import uuid
from DIRAC import S_OK, S_ERROR, gConfig
from DIRAC.Core.Security import Locations, X509Chain

BASECS = "WebApp"

def getCSValue( opt, defValue = None ):
  return gConfig.getValue( "%s/%s" % ( BASECS, opt ), defValue )

def debug():
  return getCSValue( "Debug", False )

def rootURL():
  return getCSValue( "RootURL", "/DIRAC" )

def HTTPS():
  return getCSValue( "HTTPS/Enabled", True )

def HTTPPort():
  return getCSValue( "HTTP/Port", 8080 )

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
  #TODO: Store the secret somewhere
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
      fn = tempfile.mkstemp( prefix = "cas.", suffix = ".pem" )
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
      if chain.hasExpired():
        continue
      fd.write( chain.dumpAllToString()[ 'Value' ] )
    fd.close()
    return fn
  return False

def getAuthSectionForRoute( route ):
  return "%s/Access/%s" % ( BASECS, route )


