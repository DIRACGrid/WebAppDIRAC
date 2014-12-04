
import os
import uuid
import tornado.process
from DIRAC import S_OK, S_ERROR, gConfig
from DIRAC.Core.Security import Locations, X509Chain

BASECS = "/WebApp"

def getCSValue( opt, defValue = None ):
  return gConfig.getValue( "%s/%s" % ( BASECS, opt ), defValue )

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
      expired = chain.hasExpired()
      if not expired[ 'OK' ] or expired[ 'Value' ]:
        continue
      fd.write( chain.dumpAllToString()[ 'Value' ] )
    fd.close()
    return fn
  return False

def getAuthSectionForHandler( route ):
  return "%s/Access/%s" % ( BASECS, route )

def getTheme():
  return getCSValue( "Theme", "desktop" )

def getMonitoringSectionFromCS( path ):
  sectionsList = []
  base = "%s/Schema/System Monitoring" % ( BASECS )
  nodes = path.split( '/' ) if path != '/' else []
  if len( nodes ) == 0:
     fullName = "%s/%s" % ( base, path )
     result = gConfig.getSections( fullName )
     if not result['OK']:
       return result
     else:
       services = []
       for i in result['Value']:
         services.append( [( 'service', i )] )
       return services
  else:
    leaf = '%s/%s' % ( base, path )
    val = __recursiveTreeTraversal( base, "", nodes, leaf )
    return val

def __recursiveTreeTraversal( base, path, visit, leaf ):
  fullName = "%s/%s" % ( base, path )
  result = gConfig.getSections( fullName )
  schema = []
  if not result[ 'OK' ]:
    return schema
  sectionsList = result[ 'Value' ]
  for sName in sectionsList:
    if sName in visit:
      visit.remove( sName )
      visited = "%s/%s" % ( base, sName )
      path = "%s/%s" % ( path, sName ) if path != '' else sName
      schema = __recursiveTreeTraversal( base, path, visit, leaf )
    elif leaf == fullName:
      schema.append( [( 'service', sName )] )

  result = gConfig.getOptions( fullName )
  if not result[ 'OK' ]:
    return schema
  optionsList = result[ 'Value' ]
  for opName in optionsList:
    opVal = gConfig.getValue( "%s/%s" % ( fullName, opName ) )
    schema.append( [( "comp", opName, opVal )] )
  return schema

<<<<<<< Updated upstream
def getIcon():
  return getCSValue("Icon","/static/core/img/icons/system/favicon.ico")
=======
>>>>>>> Stashed changes
