from WebAppDIRAC.Lib.WebHandler import WebHandler, WErr, WOK, asyncGen
from DIRAC.Core.DISET.RPCClient import RPCClient
from DIRAC import gConfig, S_OK, S_ERROR, gLogger
from DIRAC.Core.Utilities import Time
from DIRAC.Core.Security import CS
import json
import ast

class PilotSummaryHandler(WebHandler):

  AUTH_PROPS = "authenticated"

  @asyncGen
  def web_getPilotSummaryData(self):
    RPC = RPCClient("WorkloadManagement/WMSAdministrator", timeout = 600 )
    callback = {}
    req = self.__request()
    #convert requests to string
    #req = {'Site': 'LCG.CERN.ch'}
    #req = {'ExpandSite': 'LCG.CERN.ch'}
    print self.globalSort
    print self.pageNumber
    print self.numberOfJobs
    #self.finish({"success": "true", "extra": {"Scheduled": 2673, "Status": "Good", "Aborted_Hour": 102, "Waiting": 140, "Submitted": 7, "PilotsPerJob": "1.11", "Ready": 1, "Running": 22563, "PilotJobEff": "98.19", "Done": 101942, "Aborted": 2351, "Done_Empty": 10271, "Total": 129677}, "request": "", "result": [{"Scheduled": 0, "Status": "Bad", "Aborted_Hour": 44, "Site": "", "Submitted": 2, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 129, "PilotJobEff": "13.17", "Done": 2, "CE": "Unknown", "Aborted": 877, "Ready": 0, "Total": 1010, "InMask": "No", "Running": 0}, {"Scheduled": 0, "Status": "Idle", "Aborted_Hour": 0, "Site": "Unknown", "Submitted": 5, "PilotsPerJob": "0.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "100.00", "Done": 0, "CE": "NotAssigned", "Aborted": 0, "Ready": 0, "Total": 5, "InMask": "No", "Running": 0}, {"Scheduled": 32, "Status": "Good", "Aborted_Hour": 2, "Site": "LCG.Lancashire.uk", "Submitted": 0, "PilotsPerJob": "1.17", "Done_Empty": 40, "Waiting": 0, "PilotJobEff": "94.13", "Done": 280, "CE": "Multiple", "Aborted": 22, "Ready": 0, "Total": 375, "InMask": "Yes", "Running": 41}, {"Scheduled": 12, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Legnaro.it", "Submitted": 0, "PilotsPerJob": "1.53", "Done_Empty": 20, "Waiting": 0, "PilotJobEff": "93.90", "Done": 58, "CE": "Multiple", "Aborted": 5, "Ready": 0, "Total": 82, "InMask": "Yes", "Running": 7}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "ARC.Bristol.uk", "Submitted": 0, "PilotsPerJob": "2.67", "Done_Empty": 20, "Waiting": 0, "PilotJobEff": "100.00", "Done": 32, "CE": "lcgce01.phy.bris.ac.uk", "Aborted": 0, "Ready": 0, "Total": 48, "InMask": "Yes", "Running": 16}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "DIRAC.Zurich.ch", "Submitted": 0, "PilotsPerJob": "1.79", "Done_Empty": 85, "Waiting": 10, "PilotJobEff": "99.36", "Done": 193, "CE": "y.zurich.ch", "Aborted": 2, "Ready": 0, "Total": 313, "InMask": "Yes", "Running": 108}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.IFJ-PAN.pl", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "100.00", "Done": 27, "CE": "fwe02.ifj.edu.pl", "Aborted": 0, "Ready": 0, "Total": 27, "InMask": "Yes", "Running": 0}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.PNPI.ru", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "100.00", "Done": 6, "CE": "gt3.pnpi.nw.ru", "Aborted": 0, "Ready": 0, "Total": 12, "InMask": "Yes", "Running": 6}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.WCSS.pl", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "100.00", "Done": 351, "CE": "dwarf.wcss.wroc.pl", "Aborted": 0, "Ready": 0, "Total": 351, "InMask": "Yes", "Running": 0}, {"Scheduled": 0, "Status": "Bad", "Aborted_Hour": 47, "Site": "LCG.NIPNE-15.ro", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "10.04", "Done": 46, "CE": "tblb01.nipne.ro", "Aborted": 475, "Ready": 0, "Total": 528, "InMask": "Yes", "Running": 7}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.GRISU-UNINA.it", "Submitted": 0, "PilotsPerJob": "99.00", "Done_Empty": 54, "Waiting": 0, "PilotJobEff": "100.00", "Done": 54, "CE": "grisuce.scope.unina.it", "Aborted": 0, "Ready": 0, "Total": 54, "InMask": "No", "Running": 0}, {"Scheduled": 3, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.INR.ru", "Submitted": 0, "PilotsPerJob": "1.46", "Done_Empty": 33, "Waiting": 0, "PilotJobEff": "100.00", "Done": 105, "CE": "grcreamce.inr.troitsk.ru", "Aborted": 0, "Ready": 0, "Total": 175, "InMask": "Yes", "Running": 67}, {"Scheduled": 19, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.SINP.ru", "Submitted": 0, "PilotsPerJob": "2.91", "Done_Empty": 261, "Waiting": 0, "PilotJobEff": "99.42", "Done": 398, "CE": "Multiple", "Aborted": 3, "Ready": 0, "Total": 520, "InMask": "Yes", "Running": 100}, {"Scheduled": 21, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.UKI-LT2-RHUL.uk", "Submitted": 0, "PilotsPerJob": "1.02", "Done_Empty": 12, "Waiting": 0, "PilotJobEff": "98.98", "Done": 529, "CE": "Multiple", "Aborted": 6, "Ready": 0, "Total": 589, "InMask": "Yes", "Running": 33}, {"Scheduled": 1, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Torino.it", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "85.88", "Done": 802, "CE": "t2-ce-01.to.infn.it", "Aborted": 132, "Ready": 0, "Total": 935, "InMask": "No", "Running": 0}, {"Scheduled": 270, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.CNAF.it", "Submitted": 0, "PilotsPerJob": "1.32", "Done_Empty": 1461, "Waiting": 0, "PilotJobEff": "99.94", "Done": 5967, "CE": "Multiple", "Aborted": 5, "Ready": 0, "Total": 8886, "InMask": "Yes", "Running": 2644}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "DIRAC.Syracuse.us", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "100.00", "Done": 7919, "CE": "phy.syr.us", "Aborted": 0, "Ready": 0, "Total": 7919, "InMask": "No", "Running": 0}, {"Scheduled": 2, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.BHAM-HEP.uk", "Submitted": 0, "PilotsPerJob": "1.24", "Done_Empty": 43, "Waiting": 0, "PilotJobEff": "100.00", "Done": 219, "CE": "epgr02.ph.bham.ac.uk", "Aborted": 0, "Ready": 0, "Total": 419, "InMask": "Yes", "Running": 198}, {"Scheduled": 66, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.USC.es", "Submitted": 0, "PilotsPerJob": "1.22", "Done_Empty": 193, "Waiting": 0, "PilotJobEff": "100.00", "Done": 1064, "CE": "Multiple", "Aborted": 0, "Ready": 0, "Total": 1385, "InMask": "Yes", "Running": 255}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Pisa.it", "Submitted": 0, "PilotsPerJob": "1.06", "Done_Empty": 77, "Waiting": 0, "PilotJobEff": "98.41", "Done": 1300, "CE": "Multiple", "Aborted": 21, "Ready": 0, "Total": 1321, "InMask": "No", "Running": 0}, {"Scheduled": 10, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.ITEP.ru", "Submitted": 0, "PilotsPerJob": "1.69", "Done_Empty": 36, "Waiting": 0, "PilotJobEff": "87.28", "Done": 88, "CE": "creamce1.itep.ru", "Aborted": 22, "Ready": 0, "Total": 173, "InMask": "Yes", "Running": 53}, {"Scheduled": 10, "Status": "Fair", "Aborted_Hour": 0, "Site": "LCG.RAL-HEP.uk", "Submitted": 0, "PilotsPerJob": "1.83", "Done_Empty": 129, "Waiting": 0, "PilotJobEff": "82.44", "Done": 285, "CE": "Multiple", "Aborted": 79, "Ready": 0, "Total": 450, "InMask": "Yes", "Running": 76}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.ARAGRID-CIENCIAS.es", "Submitted": 0, "PilotsPerJob": "2.75", "Done_Empty": 56, "Waiting": 0, "PilotJobEff": "100.00", "Done": 88, "CE": "creamc-iber.bifi.unizar.es", "Aborted": 0, "Ready": 0, "Total": 134, "InMask": "Yes", "Running": 46}, {"Scheduled": 83, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.IHEP.su", "Submitted": 0, "PilotsPerJob": "1.40", "Done_Empty": 65, "Waiting": 0, "PilotJobEff": "100.00", "Done": 228, "CE": "Multiple", "Aborted": 0, "Ready": 0, "Total": 444, "InMask": "Yes", "Running": 133}, {"Scheduled": 67, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.PIC.es", "Submitted": 0, "PilotsPerJob": "1.55", "Done_Empty": 364, "Waiting": 0, "PilotJobEff": "99.80", "Done": 1025, "CE": "Multiple", "Aborted": 3, "Ready": 0, "Total": 1525, "InMask": "Yes", "Running": 430}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.SPBU.ru", "Submitted": 0, "PilotsPerJob": "99.00", "Done_Empty": 64, "Waiting": 0, "PilotJobEff": "100.00", "Done": 64, "CE": "alice23.spbu.ru", "Aborted": 0, "Ready": 0, "Total": 70, "InMask": "No", "Running": 6}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "ARC.RALPP.uk", "Submitted": 0, "PilotsPerJob": "1.63", "Done_Empty": 19, "Waiting": 0, "PilotJobEff": "100.00", "Done": 49, "CE": "heplnv146.pp.rl.ac.uk", "Aborted": 0, "Ready": 0, "Total": 62, "InMask": "Yes", "Running": 13}, {"Scheduled": 65, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.UKI-LT2-IC-HEP.uk", "Submitted": 0, "PilotsPerJob": "1.09", "Done_Empty": 95, "Waiting": 0, "PilotJobEff": "99.67", "Done": 1206, "CE": "Multiple", "Aborted": 5, "Ready": 0, "Total": 1523, "InMask": "Yes", "Running": 247}, {"Scheduled": 20, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Cambridge.uk", "Submitted": 0, "PilotsPerJob": "1.07", "Done_Empty": 7, "Waiting": 0, "PilotJobEff": "99.57", "Done": 114, "CE": "vserv13.hep.phy.cam.ac.uk", "Aborted": 1, "Ready": 0, "Total": 231, "InMask": "Yes", "Running": 96}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.IN2P3.fr", "Submitted": 0, "PilotsPerJob": "1.05", "Done_Empty": 152, "Waiting": 0, "PilotJobEff": "99.59", "Done": 3361, "CE": "Multiple", "Aborted": 23, "Ready": 0, "Total": 5648, "InMask": "Yes", "Running": 2264}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.NIPNE-11.ro", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "100.00", "Done": 3622, "CE": "lhcb-ce.nipne.ro", "Aborted": 0, "Ready": 0, "Total": 3622, "InMask": "Yes", "Running": 0}, {"Scheduled": 0, "Status": "Idle", "Aborted_Hour": 0, "Site": "LCG.Dortmund.de", "Submitted": 0, "PilotsPerJob": "1.25", "Done_Empty": 1, "Waiting": 0, "PilotJobEff": "75.00", "Done": 5, "CE": "udo-ce06.grid.tu-dortmund.de", "Aborted": 2, "Ready": 0, "Total": 8, "InMask": "Yes", "Running": 1}, {"Scheduled": 136, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.SARA.nl", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "99.63", "Done": 617, "CE": "Multiple", "Aborted": 5, "Ready": 0, "Total": 1362, "InMask": "Yes", "Running": 604}, {"Scheduled": 20, "Status": "Fair", "Aborted_Hour": 0, "Site": "LCG.AUVER.fr", "Submitted": 0, "PilotsPerJob": "3.43", "Done_Empty": 17, "Waiting": 0, "PilotJobEff": "75.47", "Done": 24, "CE": "cirigridce01.univ-bpclermont.fr", "Aborted": 91, "Ready": 0, "Total": 371, "InMask": "Yes", "Running": 236}, {"Scheduled": 51, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.PSNC.pl", "Submitted": 0, "PilotsPerJob": "16.33", "Done_Empty": 46, "Waiting": 0, "PilotJobEff": "100.00", "Done": 49, "CE": "creamce.reef.man.poznan.pl", "Aborted": 0, "Ready": 0, "Total": 143, "InMask": "Yes", "Running": 43}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.UNINA.it", "Submitted": 0, "PilotsPerJob": "76.00", "Done_Empty": 75, "Waiting": 0, "PilotJobEff": "100.00", "Done": 76, "CE": "ce.scope.unina.it", "Aborted": 0, "Ready": 0, "Total": 76, "InMask": "No", "Running": 0}, {"Scheduled": 40, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Sheffield.uk", "Submitted": 0, "PilotsPerJob": "1.37", "Done_Empty": 11, "Waiting": 0, "PilotJobEff": "94.29", "Done": 41, "CE": "Multiple", "Aborted": 6, "Ready": 0, "Total": 105, "InMask": "Yes", "Running": 18}, {"Scheduled": 0, "Status": "Fair", "Aborted_Hour": 0, "Site": "LCG.Ferrara.it", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "84.62", "Done": 6, "CE": "grid0.fe.infn.it", "Aborted": 2, "Ready": 0, "Total": 13, "InMask": "Yes", "Running": 5}, {"Scheduled": 9, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.CPPM.fr", "Submitted": 0, "PilotsPerJob": "1.17", "Done_Empty": 83, "Waiting": 0, "PilotJobEff": "100.00", "Done": 572, "CE": "Multiple", "Aborted": 0, "Ready": 0, "Total": 1103, "InMask": "Yes", "Running": 522}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.NCBJ.pl", "Submitted": 0, "PilotsPerJob": "1.14", "Done_Empty": 16, "Waiting": 0, "PilotJobEff": "98.58", "Done": 134, "CE": "ce.cis.gov.pl", "Aborted": 2, "Ready": 0, "Total": 141, "InMask": "Yes", "Running": 5}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.ITWM.de", "Submitted": 0, "PilotsPerJob": "1.38", "Done_Empty": 9, "Waiting": 0, "PilotJobEff": "97.96", "Done": 33, "CE": "fornax-ce.itwm.fhg.de", "Aborted": 1, "Ready": 0, "Total": 49, "InMask": "Yes", "Running": 15}, {"Scheduled": 13, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.LPNHE.fr", "Submitted": 0, "PilotsPerJob": "1.22", "Done_Empty": 67, "Waiting": 0, "PilotJobEff": "100.00", "Done": 374, "CE": "lpnhe-cream.in2p3.fr", "Aborted": 0, "Ready": 0, "Total": 476, "InMask": "Yes", "Running": 89}, {"Scheduled": 138, "Status": "Good", "Aborted_Hour": 1, "Site": "LCG.WEIZMANN.il", "Submitted": 0, "PilotsPerJob": "1.37", "Done_Empty": 14, "Waiting": 0, "PilotJobEff": "99.58", "Done": 52, "CE": "wipp-crm.weizmann.ac.il", "Aborted": 1, "Ready": 0, "Total": 238, "InMask": "Yes", "Running": 47}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 8, "Site": "DIRAC.YANDEX.ru", "Submitted": 0, "PilotsPerJob": "1.25", "Done_Empty": 931, "Waiting": 1, "PilotJobEff": "98.67", "Done": 4633, "CE": "x.yandex.ru", "Aborted": 65, "Ready": 0, "Total": 4888, "InMask": "Yes", "Running": 189}, {"Scheduled": 252, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.RAL.uk", "Submitted": 0, "PilotsPerJob": "1.25", "Done_Empty": 590, "Waiting": 0, "PilotJobEff": "99.73", "Done": 2997, "CE": "Multiple", "Aborted": 15, "Ready": 0, "Total": 5537, "InMask": "Yes", "Running": 2273}, {"Scheduled": 5, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.RUG.nl", "Submitted": 0, "PilotsPerJob": "1.13", "Done_Empty": 60, "Waiting": 0, "PilotJobEff": "99.11", "Done": 505, "CE": "cygnus.grid.rug.nl", "Aborted": 9, "Ready": 0, "Total": 1013, "InMask": "Yes", "Running": 494}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.BIFI.es", "Submitted": 0, "PilotsPerJob": "1.08", "Done_Empty": 21, "Waiting": 0, "PilotJobEff": "100.00", "Done": 293, "CE": "cream01-egi.bifi.unizar.es", "Aborted": 0, "Ready": 0, "Total": 383, "InMask": "Yes", "Running": 90}, {"Scheduled": 0, "Status": "Poor", "Aborted_Hour": 0, "Site": "LCG.GR-04.gr", "Submitted": 0, "PilotsPerJob": "99.00", "Done_Empty": 7, "Waiting": 0, "PilotJobEff": "33.33", "Done": 7, "CE": "grid001.ics.forth.gr", "Aborted": 14, "Ready": 0, "Total": 21, "InMask": "No", "Running": 0}, {"Scheduled": 14, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.CSCS.ch", "Submitted": 0, "PilotsPerJob": "1.16", "Done_Empty": 77, "Waiting": 0, "PilotJobEff": "100.00", "Done": 550, "CE": "Multiple", "Aborted": 0, "Ready": 0, "Total": 830, "InMask": "Yes", "Running": 266}, {"Scheduled": 36, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Bristol.uk", "Submitted": 0, "PilotsPerJob": "1.92", "Done_Empty": 107, "Waiting": 0, "PilotJobEff": "98.95", "Done": 223, "CE": "Multiple", "Aborted": 4, "Ready": 0, "Total": 382, "InMask": "Yes", "Running": 119}, {"Scheduled": 343, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.CERN.ch", "Submitted": 0, "PilotsPerJob": "1.39", "Done_Empty": 1547, "Waiting": 0, "PilotJobEff": "99.17", "Done": 5550, "CE": "Multiple", "Aborted": 75, "Ready": 0, "Total": 9023, "InMask": "Yes", "Running": 3055}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.NAPOLI-ATLAS.it", "Submitted": 0, "PilotsPerJob": "99.00", "Done_Empty": 27, "Waiting": 0, "PilotJobEff": "93.10", "Done": 27, "CE": "Multiple", "Aborted": 2, "Ready": 0, "Total": 29, "InMask": "No", "Running": 0}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Oxford.uk", "Submitted": 0, "PilotsPerJob": "1.22", "Done_Empty": 24, "Waiting": 0, "PilotJobEff": "98.55", "Done": 131, "CE": "Multiple", "Aborted": 3, "Ready": 0, "Total": 207, "InMask": "Yes", "Running": 73}, {"Scheduled": 0, "Status": "Idle", "Aborted_Hour": 0, "Site": "LCG.Trieste.it", "Submitted": 0, "PilotsPerJob": "99.00", "Done_Empty": 6, "Waiting": 0, "PilotJobEff": "100.00", "Done": 6, "CE": "ce1.ts.infn.it", "Aborted": 0, "Ready": 0, "Total": 6, "InMask": "No", "Running": 0}, {"Scheduled": 1, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Barcelona.es", "Submitted": 0, "PilotsPerJob": "1.10", "Done_Empty": 109, "Waiting": 0, "PilotJobEff": "100.00", "Done": 1197, "CE": "Multiple", "Aborted": 0, "Ready": 0, "Total": 1543, "InMask": "Yes", "Running": 345}, {"Scheduled": 0, "Status": "Fair", "Aborted_Hour": 0, "Site": "LCG.Bologna.it", "Submitted": 0, "PilotsPerJob": "37.00", "Done_Empty": 36, "Waiting": 0, "PilotJobEff": "83.33", "Done": 37, "CE": "cebo-t3-01.cr.cnaf.infn.it", "Aborted": 9, "Ready": 0, "Total": 54, "InMask": "Yes", "Running": 8}, {"Scheduled": 34, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Krakow.pl", "Submitted": 0, "PilotsPerJob": "1.18", "Done_Empty": 91, "Waiting": 0, "PilotJobEff": "99.78", "Done": 610, "CE": "Multiple", "Aborted": 2, "Ready": 0, "Total": 901, "InMask": "Yes", "Running": 255}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.ICM.pl", "Submitted": 0, "PilotsPerJob": "1.07", "Done_Empty": 11, "Waiting": 0, "PilotJobEff": "99.46", "Done": 165, "CE": "Multiple", "Aborted": 1, "Ready": 0, "Total": 184, "InMask": "Yes", "Running": 18}, {"Scheduled": 17, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.KIAE.ru", "Submitted": 0, "PilotsPerJob": "1.12", "Done_Empty": 81, "Waiting": 0, "PilotJobEff": "100.00", "Done": 730, "CE": "foam.grid.kiae.ru", "Aborted": 0, "Ready": 0, "Total": 929, "InMask": "Yes", "Running": 182}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.NIKHEF.nl", "Submitted": 0, "PilotsPerJob": "1.29", "Done_Empty": 317, "Waiting": 0, "PilotJobEff": "99.71", "Done": 1429, "CE": "Multiple", "Aborted": 6, "Ready": 0, "Total": 2093, "InMask": "Yes", "Running": 658}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.LAL.fr", "Submitted": 0, "PilotsPerJob": "1.27", "Done_Empty": 354, "Waiting": 0, "PilotJobEff": "99.96", "Done": 1682, "CE": "grid36.lal.in2p3.fr", "Aborted": 1, "Ready": 0, "Total": 2665, "InMask": "Yes", "Running": 982}, {"Scheduled": 30, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.ECDF.uk", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 4, "Waiting": 0, "PilotJobEff": "94.15", "Done": 1579, "CE": "Multiple", "Aborted": 100, "Ready": 0, "Total": 1709, "InMask": "No", "Running": 0}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Frascati.it", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "98.88", "Done": 531, "CE": "Multiple", "Aborted": 6, "Ready": 0, "Total": 537, "InMask": "Yes", "Running": 0}, {"Scheduled": 78, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Glasgow.uk", "Submitted": 0, "PilotsPerJob": "1.06", "Done_Empty": 142, "Waiting": 0, "PilotJobEff": "97.01", "Done": 2709, "CE": "Multiple", "Aborted": 95, "Ready": 0, "Total": 3182, "InMask": "Yes", "Running": 300}, {"Scheduled": 0, "Status": "Idle", "Aborted_Hour": 0, "Site": "LCG.SNS-PISA.it", "Submitted": 0, "PilotsPerJob": "99.00", "Done_Empty": 3, "Waiting": 0, "PilotJobEff": "100.00", "Done": 3, "CE": "gridce.sns.it", "Aborted": 0, "Ready": 0, "Total": 3, "InMask": "No", "Running": 0}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.EFDA.uk", "Submitted": 0, "PilotsPerJob": "99.00", "Done_Empty": 65, "Waiting": 0, "PilotJobEff": "98.48", "Done": 65, "CE": "grid002.jet.efda.org", "Aborted": 1, "Ready": 0, "Total": 66, "InMask": "No", "Running": 0}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.RRCKI.ru", "Submitted": 0, "PilotsPerJob": "1.04", "Done_Empty": 109, "Waiting": 0, "PilotJobEff": "99.86", "Done": 2829, "CE": "Multiple", "Aborted": 5, "Ready": 0, "Total": 3538, "InMask": "Yes", "Running": 704}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.LLR.fr", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "98.60", "Done": 1469, "CE": "llrcream.in2p3.fr", "Aborted": 21, "Ready": 1, "Total": 1502, "InMask": "Yes", "Running": 11}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Padova.it", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "96.85", "Done": 2093, "CE": "prod-ce-01.pd.infn.it", "Aborted": 68, "Ready": 0, "Total": 2161, "InMask": "Yes", "Running": 0}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.IN2P3-T2.fr", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "100.00", "Done": 7712, "CE": "Multiple", "Aborted": 0, "Ready": 0, "Total": 7712, "InMask": "No", "Running": 0}, {"Scheduled": 28, "Status": "Fair", "Aborted_Hour": 0, "Site": "LCG.UKI-LT2-QMUL.uk", "Submitted": 0, "PilotsPerJob": "1.06", "Done_Empty": 2, "Waiting": 0, "PilotJobEff": "83.56", "Done": 33, "CE": "Multiple", "Aborted": 12, "Ready": 0, "Total": 73, "InMask": "Yes", "Running": 0}, {"Scheduled": 40, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.LAPP.fr", "Submitted": 0, "PilotsPerJob": "1.80", "Done_Empty": 227, "Waiting": 0, "PilotJobEff": "99.42", "Done": 511, "CE": "Multiple", "Aborted": 5, "Ready": 0, "Total": 864, "InMask": "Yes", "Running": 308}, {"Scheduled": 24, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Durham.uk", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "99.99", "Done": 12937, "CE": "ce1.dur.scotgrid.ac.uk", "Aborted": 1, "Ready": 0, "Total": 12962, "InMask": "Yes", "Running": 0}, {"Scheduled": 1, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.TAU.il", "Submitted": 0, "PilotsPerJob": "1.60", "Done_Empty": 3, "Waiting": 0, "PilotJobEff": "92.86", "Done": 8, "CE": "tau-cream.hep.tau.ac.il", "Aborted": 1, "Ready": 0, "Total": 14, "InMask": "Yes", "Running": 4}, {"Scheduled": 20, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.CBPF.br", "Submitted": 0, "PilotsPerJob": "1.20", "Done_Empty": 84, "Waiting": 0, "PilotJobEff": "99.86", "Done": 513, "CE": "Multiple", "Aborted": 1, "Ready": 0, "Total": 695, "InMask": "Yes", "Running": 161}, {"Scheduled": 20, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.JINR.ru", "Submitted": 0, "PilotsPerJob": "1.27", "Done_Empty": 59, "Waiting": 0, "PilotJobEff": "100.00", "Done": 275, "CE": "Multiple", "Aborted": 0, "Ready": 0, "Total": 438, "InMask": "Yes", "Running": 143}, {"Scheduled": 2, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Haifa.il", "Submitted": 0, "PilotsPerJob": "1.43", "Done_Empty": 3, "Waiting": 0, "PilotJobEff": "100.00", "Done": 10, "CE": "tech-crm.hep.technion.ac.il", "Aborted": 0, "Ready": 0, "Total": 16, "InMask": "Yes", "Running": 4}, {"Scheduled": 29, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.CNAF-T2.it", "Submitted": 0, "PilotsPerJob": "1.15", "Done_Empty": 56, "Waiting": 0, "PilotJobEff": "100.00", "Done": 438, "CE": "Multiple", "Aborted": 0, "Ready": 0, "Total": 761, "InMask": "Yes", "Running": 294}, {"Scheduled": 59, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.LPC.fr", "Submitted": 0, "PilotsPerJob": "1.42", "Done_Empty": 149, "Waiting": 0, "PilotJobEff": "99.51", "Done": 501, "CE": "Multiple", "Aborted": 4, "Ready": 0, "Total": 816, "InMask": "Yes", "Running": 252}, {"Scheduled": 44, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.UKI-LT2-Brunel.uk", "Submitted": 0, "PilotsPerJob": "1.16", "Done_Empty": 68, "Waiting": 0, "PilotJobEff": "100.00", "Done": 490, "CE": "Multiple", "Aborted": 0, "Ready": 0, "Total": 703, "InMask": "Yes", "Running": 169}, {"Scheduled": 18, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.NIPNE-07.ro", "Submitted": 0, "PilotsPerJob": "1.27", "Done_Empty": 28, "Waiting": 0, "PilotJobEff": "96.17", "Done": 130, "CE": "tbit03.nipne.ro", "Aborted": 8, "Ready": 0, "Total": 209, "InMask": "Yes", "Running": 53}, {"Scheduled": 0, "Status": "Idle", "Aborted_Hour": 0, "Site": "LCG.KIMON.cy", "Submitted": 0, "PilotsPerJob": "1.25", "Done_Empty": 1, "Waiting": 0, "PilotJobEff": "100.00", "Done": 5, "CE": "ce101.grid.ucy.ac.cy", "Aborted": 0, "Ready": 0, "Total": 6, "InMask": "Yes", "Running": 1}, {"Scheduled": 0, "Status": "Idle", "Aborted_Hour": 0, "Site": "LCG.BMEGrid.hu", "Submitted": 0, "PilotsPerJob": "99.00", "Done_Empty": 6, "Waiting": 0, "PilotJobEff": "100.00", "Done": 6, "CE": "ce.hpc.iit.bme.hu", "Aborted": 0, "Ready": 0, "Total": 6, "InMask": "No", "Running": 0}, {"Scheduled": 23, "Status": "Good", "Aborted_Hour": 0, "Site": "ARC.RAL.uk", "Submitted": 0, "PilotsPerJob": "11.00", "Done_Empty": 10, "Waiting": 0, "PilotJobEff": "100.00", "Done": 11, "CE": "Multiple", "Aborted": 0, "Ready": 0, "Total": 111, "InMask": "Yes", "Running": 77}, {"Scheduled": 0, "Status": "Fair", "Aborted_Hour": 0, "Site": "LCG.Catania.it", "Submitted": 0, "PilotsPerJob": "1.27", "Done_Empty": 4, "Waiting": 0, "PilotJobEff": "83.87", "Done": 19, "CE": "grid012.ct.infn.it", "Aborted": 5, "Ready": 0, "Total": 31, "InMask": "Yes", "Running": 7}, {"Scheduled": 425, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.GRIDKA.de", "Submitted": 0, "PilotsPerJob": "1.18", "Done_Empty": 1077, "Waiting": 0, "PilotJobEff": "99.94", "Done": 7017, "CE": "Multiple", "Aborted": 6, "Ready": 0, "Total": 9495, "InMask": "Yes", "Running": 2047}, {"Scheduled": 42, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Liverpool.uk", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 25, "Waiting": 0, "PilotJobEff": "99.91", "Done": 6634, "CE": "Multiple", "Aborted": 6, "Ready": 0, "Total": 6807, "InMask": "Yes", "Running": 125}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "DIRAC.OSC.us", "Submitted": 0, "PilotsPerJob": "1.00", "Done_Empty": 0, "Waiting": 0, "PilotJobEff": "100.00", "Done": 561, "CE": "oakley.osc.edu", "Aborted": 0, "Ready": 0, "Total": 561, "InMask": "No", "Running": 0}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.Manchester.uk", "Submitted": 0, "PilotsPerJob": "1.16", "Done_Empty": 79, "Waiting": 0, "PilotJobEff": "99.90", "Done": 570, "CE": "Multiple", "Aborted": 1, "Ready": 0, "Total": 1036, "InMask": "Yes", "Running": 465}, {"Scheduled": 0, "Status": "Good", "Aborted_Hour": 0, "Site": "LCG.DESY.de", "Submitted": 0, "PilotsPerJob": "99.00", "Done_Empty": 46, "Waiting": 0, "PilotJobEff": "85.19", "Done": 46, "CE": "grid-cr4.desy.de", "Aborted": 8, "Ready": 0, "Total": 54, "InMask": "No", "Running": 0}], "date": "2014-02-17 14:37 [UTC]", "total": 90})
    result = yield self.threadTask(RPC.getPilotSummaryWeb, req, self.globalSort , self.pageNumber, self.numberOfJobs)

    if not result["OK"]:
      self.finish({"success":"false", "result":[], "total":0, "error":result["Message"]})
      return

    result = result["Value"]

    if not result.has_key("TotalRecords"):
      self.finish({"success":"false", "result":[], "total":-1, "error":"Data structure is corrupted"})
      return


    if not (result["TotalRecords"] > 0):
      self.finish({"success":"false", "result":[], "total":0, "error":"There were no data matching your selection"})
      return


    if not (result.has_key("ParameterNames") and result.has_key("Records")):
      self.finish({"success":"false", "result":[], "total":-1, "error":"Data structure is corrupted"})
      return

    if not (len(result["ParameterNames"]) > 0):
      self.finish({"success":"false", "result":[], "total":-1, "error":"ParameterNames field is missing"})
      return

    if not (len(result["Records"]) > 0):
      self.finish({"success":"false", "result":[], "total":0, "Message":"There are no data to display"})
      return

    callback = []
    jobs = result["Records"]
    head = result["ParameterNames"]
    headLength = len(head)

    for i in jobs:
      tmp = {}
      for j in range(0,headLength):
        tmp[head[j]] = i[j]
      callback.append(tmp)
    total = result["TotalRecords"]
    total = result["TotalRecords"]
    timestamp = Time.dateTime().strftime("%Y-%m-%d %H:%M [UTC]")
    if result.has_key("Extras"):
      st = self.__dict2string({})
      extra = result["Extras"]
      callback = {"success":"true", "result":callback, "total":total, "extra":extra, "request":st, "date":timestamp }
    else:
      callback = {"success":"true", "result":callback, "total":total, "date":timestamp}
    self.finish(callback)

  def __dict2string(self, req):
    result = ""
    try:
      for key, value in req.iteritems():
        result = result + str(key) + ": " + ", ".join(value) + "; "
    except Exception, x:
      pass
      gLogger.info("\033[0;31m Exception: \033[0m %s" % x)
    result = result.strip()
    result = result[:-1]
    return result

  @asyncGen
  def web_getSelectionData(self):
    sData = self.getSessionData()
    callback = {}
    group = sData["user"]["group"]
    user = sData["user"]["username"]
    if user == "Anonymous":
      self.finish({"success":"false", "result":[], "total":0, "error":"Insufficient rights"})
    else:
      RPC = RPCClient("WorkloadManagement/JobMonitoring")
      result = RPC.getSites()
      if result["OK"]:
        tier1 = gConfig.getValue("/Website/PreferredSites")
        if tier1:
          try:
            tier1 = tier1.split(", ")
          except:
            tier1 = list()
        else:
          tier1 = list()
        site = []
        if len(result["Value"])>0:
          s = list(result["Value"])
          for i in tier1:
            site.append([str(i)])
          for i in s:
            if i not in tier1:
              site.append([str(i)])
        else:
          site = [["Nothing to display"]]
      else:
        site = [["Error during RPC call"]]
      callback["site"] = site
      self.finish(callback)


  ################################################################################
  def __request(self):
    self.pageNumber = 0
    self.numberOfJobs = 25
    self.globalSort = [["GridSite","ASC"]]
    sData = self.getSessionData()
    req = {}
    group = sData["user"]["group"]
    user = sData["user"]["username"]

    if "limit" in self.request.arguments:
      self.numberOfJobs = int(self.request.arguments["limit"][-1])
      if "start" in self.request.arguments:
        self.pageNumber = int(self.request.arguments["start"][-1])
      else:
        self.pageNumber = 0
    else:
      self.numberOfJobs = 25
      self.pageNumber = 0

    found = False
    if 'id' in self.request.arguments:
      jobids = list(json.loads(self.request.arguments[ 'id' ][-1]))
      if len(jobids) > 0:
        req['JobID'] = jobids
        found = True

    elif 'expand' in self.request.arguments:
      expand = list(json.loads(self.request.arguments[ 'expand' ][-1]))
      if len(expand) > 0:
        globalSort = [["GridSite","ASC"]]
        numberOfJobs = 500
        pageNumber = 0
        req["ExpandSite"] = expand[0]
        found = True

    if not found:

      if 'prod' in self.request.arguments:
        value = list(json.loads(self.request.arguments["prod"][-1]))
        if len(value) > 0:
          req["JobGroup"] = value

      if 'site' in self.request.arguments:
        value = list(json.loads(self.request.arguments["site"][-1]))
        if len(value) > 0:
          if len(value) == 1:
            req["ExpandSite"] = value[0]
          else:
            req["GridSite"] = value

      if 'sort' in self.request.arguments:
        sort = json.loads(self.request.arguments['sort'][-1])
        if len(sort) > 0:
          self.globalSort = []
          for i in sort :
            self.globalSort  += [[i['property'],i['direction']]]
        else:
          self.globalSort = [["GridSite","DESC"]]

    if 'startDate' in self.request.arguments and len(self.request.arguments["startDate"][0]) > 0:
      if 'startTime' in self.request.arguments and len(self.request.arguments["startTime"][0]) > 0:
        req["FromDate"] = str(self.request.arguments["startDate"][0] + " " + self.request.arguments["startTime"][0])
      else:
        req["FromDate"] = str(self.request.arguments["startDate"][0])

    if 'endDate' in self.request.arguments and len(self.request.arguments["endDate"][0]) > 0:
      if 'endTime' in self.request.arguments and len(self.request.arguments["endTime"][0]) > 0:
        req["ToDate"] = str(self.request.arguments["endDate"][0] + " " + self.request.arguments["endTime"][0])
      else:
        req["ToDate"] = str(self.request.arguments["endDate"][0])

    if 'date' in self.request.arguments and len(self.request.arguments["date"][0]) > 0:
      req["LastUpdate"] = str(self.request.arguments["date"][0])
    gLogger.info("REQUEST:",req)
    return req
