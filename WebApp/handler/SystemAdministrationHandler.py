
from DIRAC.WorkloadManagementSystem.Client.SandboxStoreClient import SandboxStoreClient
from DIRAC.FrameworkSystem.Client.SystemAdministratorClient import SystemAdministratorClient
from DIRAC.FrameworkSystem.Client.NotificationClient import NotificationClient
from DIRAC.FrameworkSystem.Client.SystemAdministratorIntegrator import SystemAdministratorIntegrator
from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Core.Utilities.List import uniqueElements
import json

class SystemAdministrationHandler(WebHandler):

  AUTH_PROPS = "authenticated"
  
  @asyncGen
  def web_getSysInfo(self):
    
    userData = self.getSessionData()
    
    DN = str(userData["user"]["DN"])
    group = str(userData["user"]["group"])

    # TODO: remove hosts code after v6r7 since it will be built-in
    result = gConfig.getSections("/Registry/Hosts")
    if not result[ "Value" ]:
      self.finish({ "success" : "false" , "error" : result[ "Message" ] })
      return
    hosts = result[ "Value" ]
    
    callback = []
    import pprint
  
    for host in hosts:
      client = SystemAdministratorClient(host , None , delegatedDN=DN ,
                                          delegatedGroup=group)
      resultHost = yield self.threadTask(client.getHostInfo)
      if resultHost[ "OK" ]:
        rec = resultHost["Value"]
        rec["Host"] = host
        callback.append(resultHost["Value"])
      else:
        callback.append({"Host":host})
   
    total = len(callback)
    if not total > 0:
      self.finish({ "success" : "false" , "error" : "No system information found" })
      return
    
    self.finish({ "success" : "true" , "result" : callback , "total" : total })
  
  @asyncGen  
  def web_getHostData(self):
    """
    Returns flatten list of components (services, agents) installed on hosts
    returned by getHosts function
    """

    # checkUserCredentials()
    userData = self.getSessionData()
    
    DN = str(userData["user"]["DN"])
    group = str(userData["user"]["group"])

    callback = list()
    
    if not (self.request.arguments.has_key("hostname") and len(self.request.arguments["hostname"][0]) > 0):
      self.finish({ "success" : "false" , "error" : "Name of the host is absent" })
      return
    
    host = self.request.arguments["hostname"][0]
    client = SystemAdministratorClient(host , None , delegatedDN=DN ,
                                          delegatedGroup=group)
    result = yield self.threadTask(client.getOverallStatus)
    gLogger.debug("Result of getOverallStatus(): %s" % result)

    if not result[ "OK" ]:
      self.finish({ "success" : "false" , "error" : result[ "Message" ] })
      return
    
    overall = result[ "Value" ]
   
    for record in self.flatten(overall):
      record[ "Host" ] = host
      callback.append(record)

    self.finish({ "success" : "true" , "result" : callback })
    
    
  def flatten(self , dataDict):

    """
    Flatten dict of dicts structure returned by getOverallStatus() method of
    SystemAdministrator client
    """

    for kind , a in dataDict.items():
      for system , b in a.items():
        for name , c in b.items():
          if ("Installed" in c) and (c[ "Installed" ]):
            c[ "Type" ] = kind
            c[ "System" ] = system
            c[ "Name" ] = name
            yield c
  
  @asyncGen  
  def web_getHostErrors(self):

    userData = self.getSessionData()
    
    DN = str(userData["user"]["DN"])
    group = str(userData["user"]["group"])
    
    if not "host" in self.request.arguments:
      self.finish({ "success" : "false" , "error" : "Name of the host is missing or not defined" })
      return
    
    host = str(self.request.arguments[ "host" ][0])

    client = SystemAdministratorClient(host , None , delegatedDN=DN , delegatedGroup=group)

    result = yield self.threadTask(client.checkComponentLog, "*")
    
    gLogger.debug(result)
    if not result[ "OK" ]:
      self.finish({ "success" : "false" , "error" : result[ "Message" ] })
      return
    result = result[ "Value" ]
    
    callback = list()
    for key, value in result.items():
      system, component = key.split("/")
      value[ "System" ] = system
      value[ "Name" ] = component
      value[ "Host" ] = host
      callback.append(value)
    total = len(callback)

    self.finish({ "success" : "true" , "result" : callback , "total" : total })

  @asyncGen
  def web_getHostLog(self):

    userData = self.getSessionData()
    
    DN = str(userData["user"]["DN"])
    group = str(userData["user"]["group"])
    
    if not "host" in self.request.arguments:
      self.finish({ "success" : "false" , "error":"Name of the host is missing or not defined"})
      return
    host = str(self.request.arguments[ "host" ][0])

    if not "system" in self.request.arguments:
      self.finish({ "success" : "false" , "error":"Name of the system is missing or not defined"})
      return
    system = str(self.request.arguments[ "system" ][0])

    if not "component" in self.request.arguments:
      self.finish({ "success" : "false" , "error":"Name of component is missing or not defined"})
      return
    
    name = str(self.request.arguments[ "component" ][0])

    client = SystemAdministratorClient(host , None , delegatedDN=DN , delegatedGroup=group)

    result = yield self.threadTask(client.getLogTail, system , name)
    gLogger.debug(result)
    
    if not result[ "OK" ]:
      self.finish({ "success" : "false" , "error":result[ "Message" ]})
      return
    
    result = result[ "Value" ]

    key = system + "_" + name
    if not key in result:
      self.finish({ "success" : "false" , "error":"%s key is absent in service response" % key})
      return
    
    log = result[ key ]

    self.finish({ "success" : "true" , "result":log.replace("\n" , "<br>")})
  
  @asyncGen  
  def web_hostAction(self):

    """
    Restart all DIRAC components on a given host
    """
    
    if not "host" in self.request.arguments:
      self.finish({ "success" : "false" , "error" : "No hostname defined" })
      return
    
    if not "action" in self.request.arguments:
      self.finish({ "success" : "false" , "error" : "No action defined" })
      return
    
    action = str(self.request.arguments[ "action" ][0])
    hosts = self.request.arguments[ "host" ][0].split(",")

    userData = self.getSessionData()
    
    DN = str(userData["user"]["DN"])
    group = str(userData["user"]["group"])

    actionSuccess = list()
    actionFailed = list()

    for i in hosts:
      client = SystemAdministratorClient(str(i) , None , delegatedDN=DN ,
                                          delegatedGroup=group)
      if action is "restart":
        result = yield self.threadTask(client.restartComponent, str("*") , str("*"))
      elif action is "revert":
        result = yield self.threadTask(client.revertSoftware)
      else:
        error = i + ": Action %s is not defined" % action
        actionFailed.append(error)
        continue

      gLogger.always(result)

      if not result[ "OK" ]:
        if result[ "Message" ].find("Unexpected EOF") > 0:
          msg = "Signal 'Unexpected EOF' received. Most likely DIRAC components"
          msg = i + ": " + msg + " were successfully restarted."
          actionSuccess.append(msg)
          continue
        error = i + ": " + result[ "Message" ]
        actionFailed.append(error)
        gLogger.error(error)
      else:
        gLogger.info(result[ "Value" ])
        actionSuccess.append(i)
      
    self.finish(self.aftermath(actionSuccess, actionFailed, action, "Host"))
  
  @asyncGen
  def web__componentAction(self):

    """
    Actions which should be done on components. The only parameters is an action
    to perform.
    Returns standard JSON response structure with with service response
    or error messages
    """

    userData = self.getSessionData()
    
    DN = str(userData["user"]["DN"])
    group = str(userData["user"]["group"])
    
    if not (("action" in self.request.arguments) and (len(self.request.arguments[ "action" ][0]) > 0)):
      self.finish({ "success" : "false" , "error" : "No action defined" })
      return
    
    action = str(self.request.arguments[ "action" ][0])

    if action not in [ "restart" , "start" , "stop" ]:
      error = "The request parameters action '%s' is unknown" % action
      gLogger.debug(error)
      self.finish({ "success" : "false" , "error" : error })
      return

    result = dict()
    for i in self.request.arguments:
      if i == "action":
        continue

      target = i.split(" @ " , 1)
      if not len(target) == 2:
        continue

      system = self.request.arguments[ i ][0]
      gLogger.always("System: %s" % system)
      host = target[ 1 ]
      gLogger.always("Host: %s" % host)
      component = target[ 0 ]
      gLogger.always("Component: %s" % component)
      if not host in result:
        result[ host ] = list()
      result[ host ].append([ system , component ])

    if not len(result) > 0:
      error = "Failed to get component(s) for %s" % action
      gLogger.debug(error)
      self.finish({ "success" : "false" , "error" : error })
      
    gLogger.always(result)
    actionSuccess = list()
    actionFailed = list()

    for hostname in result.keys():

      if not len(result[ hostname ]) > 0:
        continue

      client = SystemAdministratorClient(hostname , None , delegatedDN=DN ,
                                          delegatedGroup=group)

      for i in result[ hostname ]:

        system = i[ 0 ]
        component = i[ 1 ]

        try:
          if action == "restart":
            result = yield self.threadTask(client.restartComponent, system , component)
          elif action == "start":
            result = yield self.threadTask(client.startComponent, system , component)
          elif action == "stop":
            result = yield self.threadTask(client.stopComponent, system , component)
          else:
            result = list()
            result[ "Message" ] = "Action %s is not valid" % action
        except Exception, x:
          result = list()
          result[ "Message" ] = "Exception: %s" % str(x)
        gLogger.debug("Result: %s" % result)

        if not result[ "OK" ]:
          error = hostname + ": " + result[ "Message" ]
          actionFailed.append(error)
          gLogger.error("Failure during component %s: %s" % (action , error))
        else:
          gLogger.always("Successfully %s component %s" % (action , component))
          actionSuccess.append(component)

    self.finish(self.aftermath(actionSuccess, actionFailed, action, "Component"))
  
  
  def aftermath(self, actionSuccess, actionFailed, action, prefix):

    success = ", ".join(actionSuccess)
    failure = "\n".join(actionFailed)

    if len(actionSuccess) > 1:
      sText = prefix + "s"
    else:
      sText = prefix
      
    if len(actionFailed) > 1:
      fText = prefix + "s"
    else:
      fText = prefix

    if len(success) > 0 and len(failure) > 0:
      sMessage = "%s %sed successfully: " % (sText , action , success)
      fMessage = "Failed to %s %s:\n%s" % (action , fText , failure)
      result = sMessage + "\n\n" + fMessage
      return { "success" : "true" , "result" : result }
    elif len(success) > 0 and len(failure) < 1:
      result = "%s %sed successfully: %s" % (sText , action , success)
      return { "success" : "true" , "result" : result }
    elif len(success) < 1 and len(failure) > 0:
      result = "Failed to %s %s:\n%s" % (action , fText , failure)
      gLogger.always(result)
      return { "success" : "false" , "error" : result }
    else:
      result = "No action has performed due technical failure. Check the logs please"
      gLogger.debug(result)
      return { "success" : "false" , "error" : result }
  
  def web_getUsersGroups(self):
    
    result = gConfig.getSections("/Registry/Users")
    if not result[ "OK" ]:
      self.write({ "success" : "false" , "error" : result[ "Message" ] })
      return
    result = result[ "Value" ]
   
    users = map(lambda x : [x] , result)
    
    result = gConfig.getSections("/Registry/Groups")
    if not result[ "OK" ]:
      self.write({ "success" : "false" , "error" : result[ "Message" ] })
      return
    result = result[ "Value" ]
   
    groups = map(lambda x : [x] , result)
    
    self.write({ "success" : "true" , "users" : users, "groups" : groups, "email": self.getUserEmail()  })

  def getUserEmail(self):

    userData = self.getSessionData()
    user = userData["user"]["username"]
    
    if not user:
      gLogger.debug("user value is empty")
      return None

    if user == "anonymous":
      gLogger.debug("user is anonymous")
      return None
    
    email = gConfig.getValue("/Registry/Users/%s/Email" % user , "")
    gLogger.debug("/Registry/Users/%s/Email - '%s'" % (user , email))
    emil = email.strip()
      
    if not email:
      return None
    return email
  
  def web_sendMessage(self):

    """
    Send message(not implemented yet) or email getting parameters from request
    """

    email = self.getUserEmail()
    
    if not "subject" in self.request.arguments:
      result = "subject parameter is not in request... aborting"
      gLogger.debug(result)
      self.write({ "success" : "false" , "error" : result })
      return
    
    subject = self.checkUnicode(self.request.arguments[ "subject" ][0])
    if not len(subject) > 0:
      subject = "Message from %s" % email

    if not "message" in self.request.arguments:
      result = "msg parameter is not in request... aborting"
      gLogger.debug(result)
      self.write({ "success" : "false" , "error" : result })
      return
    
    body = self.checkUnicode(self.request.arguments[ "message" ][0])
    if not len(body) > 0:
      result = "Message body has zero length... aborting"
      gLogger.debug(result)
      self.write({ "success" : "false" , "error" : result })
      return

    users = self.request.arguments[ "users" ][0].split(",")

    groups = self.request.arguments[ "groups" ][0].split(",")
    
    gLogger.info("List of groups from request: %s" % groups)
    if groups:
      for g in groups:
        userList = self.getUsersFromGroup(g)
        gLogger.info("Get users: %s from group %s" % (userList , g))
        if userList:
          users.extend(userList)
          
    gLogger.info("Merged list of users from users and group %s" % users)

    if not len(users) > 0:
      error = "Length of list of recipients is zero size"
      gLogger.info(error)
      self.write({ "success" : "false" , "error" : error })
      return
      
    users = uniqueElements(users)
    gLogger.info("Final list of users to send message/mail: %s" % users)
    
    sendDict = self.getMailDict(users)
    self.write(self.sendMail(sendDict , subject , body , email))
    
  
  def checkUnicode(self , text=None):

    """
    Check if value is unicode or not and return properly converted string
    Arguments are string and unicode/string, return value is a string
    """
    try:
      text = text.decode('utf-8' , "replace")
    except :
      pass
    text = text.encode("utf-8")
    gLogger.debug(text)
    
    return text
  
  def getUsersFromGroup(self , groupname=None):

    if not groupname:
      gLogger.debug("Argument groupname is missing")
      return None

    users = gConfig.getValue("/Registry/Groups/%s/Users" % groupname , [])
    gLogger.debug("%s users: %s" % (groupname , users))
    if not len(users) > 0:
      gLogger.debug("No users for group %s found" % groupname)
      return None
    return users
  
  def getMailDict(self , names=None):
  
    """
    Convert list of usernames to dict like { e-mail : full name }
    Argument is a list. Return value is a dict
    """

    resultDict = dict()
    if not names:
      return resultDict
    
    for user in names:
      email = gConfig.getValue("/Registry/Users/%s/Email" % user , "")
      gLogger.debug("/Registry/Users/%s/Email - '%s'" % (user , email))
      emil = email.strip()
      
      if not email:
        gLogger.error("Can't find value for option /Registry/Users/%s/Email" % user)
        continue

      fname = gConfig.getValue("/Registry/Users/%s/FullName" % user , "")
      gLogger.debug("/Registry/Users/%s/FullName - '%s'" % (user , fname))
      fname = fname.strip()

      if not fname:
        fname = user
        gLogger.debug("FullName is absent, name to be used: %s" % fname)

      resultDict[ email ] = fname

    return resultDict
  
  def sendMail(self , sendDict=None , title=None , body=None , fromAddress=None):

    """
    Sending an email using sendDict: { e-mail : name } as addressbook
    title and body is the e-mail's Subject and Body
    fromAddress is an email address in behalf of whom the message is sent
    Return success/failure JSON structure
    """

    if not sendDict:
      result = ""
      gLogger.debug(result)
      return { "success" : "false" , "error" : result }

    if not title:
      result = "title argument is missing"
      gLogger.debug(result)
      return { "success" : "false" , "error" : result }
      
    if not body:
      result = "body argument is missing"
      gLogger.debug(result)
      return { "success" : "false" , "error" : result }

    if not fromAddress:
      result = "fromAddress argument is missing"
      gLogger.debug(result)
      return { "success" : "false" , "error" : result }

    sentSuccess = list()
    sentFailed = list()
    gLogger.debug("Initializing Notification client")
    ntc = NotificationClient(lambda x , timeout: RPCClient(x , timeout=timeout , static=True))

    for email , name in sendDict.iteritems():
      result = ntc.sendMail(email , title , body , fromAddress , False)
      if not result[ "OK" ]:
        error = name + ": " + result[ "Message" ]
        sentFailed.append(error)
        gLogger.error("Sent failure: " , error)
      else:
        gLogger.info("Successfully sent to %s" % name)
        sentSuccess.append(name)

    success = ", ".join(sentSuccess)
    failure = "\n".join(sentFailed)

    if len(success) > 0 and len(failure) > 0:
      result = "Successfully sent e-mail to: "
      result = result + success + "\n\nFailed to send e-mail to:\n" + failure
      gLogger.debug(result)
      return { "success" : "true" , "result" : result }
    elif len(success) > 0 and len(failure) < 1:
      result = "Successfully sent e-mail to: %s" % success
      gLogger.debug(result)
      return { "success" : "true" , "result" : result }
    elif len(success) < 1 and len(failure) > 0:
      result = "Failed to sent email to:\n%s" % failure
      gLogger.debug(result)
      return { "success" : "false" , "error" : result }
    else:
      result = "No messages were sent due technical failure"
      gLogger.debug(result)
      return { "success" : "false" , "error" : result }
