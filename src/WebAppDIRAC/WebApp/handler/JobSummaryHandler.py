import json
from time import time

from DIRAC import gLogger, gConfig
from DIRAC.WorkloadManagementSystem.Client.WMSAdministratorClient import WMSAdministratorClient

from WebAppDIRAC.Lib.WebHandler import WebHandler

# Dictionary of country code top-level domain (ccTLD) and corresponding country name
COUNTRIES = {
    "af": "Afghanistan",
    "al": "Albania",
    "dz": "Algeria",
    "as": "American Samoa",
    "ad": "Andorra",
    "ao": "Angola",
    "ai": "Anguilla",
    "aq": "Antarctica",
    "ag": "Antigua and Barbuda",
    "ar": "Argentina",
    "am": "Armenia",
    "aw": "Aruba",
    "au": "Australia",
    "at": "Austria",
    "az": "Azerbaijan",
    "bs": "Bahamas",
    "bh": "Bahrain",
    "bd": "Bangladesh",
    "bb": "Barbados",
    "by": "Belarus",
    "be": "Belgium",
    "bz": "Belize",
    "bj": "Benin",
    "bm": "Bermuda",
    "bt": "Bhutan",
    "bo": "Bolivia",
    "ba": "Bosnia and Herzegowina",
    "bw": "Botswana",
    "bv": "Bouvet Island",
    "br": "Brazil",
    "io": "British Indian Ocean Territory",
    "bn": "Brunei Darussalam",
    "bg": "Bulgaria",
    "bf": "Burkina Faso",
    "bi": "Burundi",
    "kh": "Cambodia",
    "cm": "Cameroon",
    "ca": "Canada",
    "cv": "Cape Verde",
    "ky": "Cayman Islands",
    "cf": "Central African Republic",
    "td": "Chad",
    "cl": "Chile",
    "cn": "China",
    "cx": "Christmas Island",
    "cc": "Cocos Islands",
    "co": "Colombia",
    "km": "Comoros",
    "cg": "Congo",
    "cd": "Congo",
    "ck": "Cook Islands",
    "cr": "Costa Rica",
    "ci": "Cote D'Ivoire",
    "hr": "Croatia",
    "cu": "Cuba",
    "cy": "Cyprus",
    "cz": "Czech Republic",
    "dk": "Denmark",
    "dj": "Djibouti",
    "dm": "Dominica",
    "do": "Dominican Republic",
    "tp": "East Timor",
    "ec": "Ecuador",
    "eg": "Egypt",
    "sv": "El Salvador",
    "gq": "Equatorial Guinea",
    "er": "Eritrea",
    "ee": "Estonia",
    "et": "Ethiopia",
    "fk": "Falkland Islands",
    "fo": "Faroe Islands",
    "fj": "Fiji",
    "fi": "Finland",
    "fr": "France",
    "fx": "France, metropolitan",
    "gf": "French Guiana",
    "pf": "French Polynesia",
    "tf": "French Southern Territories",
    "ga": "Gabon",
    "gm": "Gambia",
    "ge": "Georgia",
    "de": "Germany",
    "gh": "Ghana",
    "gi": "Gibraltar",
    "gr": "Greece",
    "gl": "Greenland",
    "gd": "Grenada",
    "gp": "Guadeloupe",
    "gu": "Guam",
    "gt": "Guatemala",
    "gn": "Guinea",
    "gw": "Guinea-Bissau",
    "gy": "Guyana",
    "ht": "Haiti",
    "hm": "Heard and Mc Donald Islands",
    "va": "Vatican City",
    "hn": "Honduras",
    "hk": "Hong Kong",
    "hu": "Hungary",
    "is": "Iceland",
    "in": "India",
    "id": "Indonesia",
    "ir": "Iran",
    "iq": "Iraq",
    "ie": "Ireland",
    "il": "Israel",
    "it": "Italy",
    "jm": "Jamaica",
    "jp": "Japan",
    "jo": "Jordan",
    "kz": "Kazakhstan",
    "ke": "Kenya",
    "ki": "Kiribati",
    "kp": "Korea",
    "kr": "Korea",
    "kw": "Kuwait",
    "kg": "Kyrgyzstan",
    "la": "Lao",
    "lv": "Latvia",
    "lb": "Lebanon",
    "ls": "Lesotho",
    "lr": "Liberia",
    "ly": "Libyan",
    "li": "Liechtenstein",
    "lt": "Lithuania",
    "lu": "Luxembourg",
    "mo": "Macau",
    "mk": "Macedonia",
    "mg": "Madagascar",
    "mw": "Malawi",
    "my": "Malaysia",
    "mv": "Maldives",
    "ml": "Mali",
    "mt": "Malta",
    "mh": "Marshall Islands",
    "mq": "Martinique",
    "mr": "Mauritania",
    "mu": "Mauritius",
    "yt": "Mayotte",
    "mx": "Mexico",
    "fm": "Micronesia",
    "md": "Moldova",
    "mc": "Monaco",
    "mn": "Mongolia",
    "ms": "Montserrat",
    "ma": "Morocco",
    "mz": "Mozambique",
    "mm": "Myanmar",
    "na": "Namibia",
    "nr": "Nauru",
    "np": "Nepal",
    "nl": "Netherlands",
    "an": "Netherlands Antilles",
    "nc": "New Caledonia",
    "nz": "New Zealand",
    "ni": "Nicaragua",
    "ne": "Niger",
    "ng": "Nigeria",
    "nu": "Niue",
    "nf": "Norfolk Island",
    "mp": "Northern Mariana Islands",
    "no": "Norway",
    "om": "Oman",
    "pk": "Pakistan",
    "pw": "Palau",
    "pa": "Panama",
    "pg": "Papua New Guinea",
    "py": "Paraguay",
    "pe": "Peru",
    "ph": "Philippines",
    "pn": "Pitcairn",
    "pl": "Poland",
    "pt": "Portugal",
    "pr": "Puerto Rico",
    "qa": "Qatar",
    "re": "Reunion",
    "ro": "Romania",
    "ru": "Russia",
    "rw": "Rwanda",
    "kn": "Saint Kitts and Nevis",
    "lc": "Saint Lucia",
    "vc": "Saint Vincent and the Grenadines",
    "ws": "Samoa",
    "sm": "San Marino",
    "st": "Sao Tome and Principe",
    "sa": "Saudi Arabia",
    "sn": "Senegal",
    "sc": "Seychelles",
    "sl": "Sierra Leone",
    "sg": "Singapore",
    "sk": "Slovakia",
    "si": "Slovenia",
    "sb": "Solomon Islands",
    "so": "Somalia",
    "za": "South Africa",
    "gs": "South Georgia and the South Sandwich Islands",
    "es": "Spain",
    "lk": "Sri Lanka",
    "sh": "St. Helena",
    "pm": "St. Pierre and Miquelon",
    "sd": "Sudan",
    "sr": "Suriname",
    "sj": "Svalbard and Jan Mayen Islands",
    "sz": "Swaziland",
    "se": "Sweden",
    "ch": "Switzerland",
    "sy": "Syrian Arab Republic",
    "tw": "Taiwan",
    "tj": "Tajikistan",
    "tz": "Tanzania",
    "th": "Thailand",
    "tg": "Togo",
    "tk": "Tokelau",
    "to": "Tonga",
    "tt": "Trinidad and Tobago",
    "tn": "Tunisia",
    "tr": "Turkey",
    "tm": "Turkmenistan",
    "tc": "Turks and Caicos Islands",
    "tv": "Tuvalu",
    "ug": "Uganda",
    "ua": "Ukraine",
    "ae": "United Arab Emirates",
    "gb": "United Kingdom",
    "uk": "United Kingdom",
    "us": "United States",
    "um": "United States Minor Outlying Islands",
    "uy": "Uruguay",
    "uz": "Uzbekistan",
    "vu": "Vanuatu",
    "ve": "Venezuela",
    "vn": "Viet Nam",
    "vg": "Virgin Islands (British)",
    "vi": "Virgin Islands (U.S.)",
    "wf": "Wallis and Futuna Islands",
    "eh": "Western Sahara",
    "ye": "Yemen",
    "yu": "Yugoslavia",
    "zm": "Zambia",
    "zw": "Zimbabwe",
    "su": "Soviet Union",
}


class JobSummaryHandler(WebHandler):
    DEFAULT_AUTHORIZATION = "all"

    pageNumber = 0
    numberOfJobs = 25
    globalSort = [["GridSite", "ASC"]]

    def web_getSelectionData(self):
        callback = {}

        result = WMSAdministratorClient().getSiteSummarySelectors()
        gLogger.info(f"\x1b[0;31m ++++++: \x1b[0m {result}")
        if result["OK"]:
            result = result["Value"]
            if len(result.get("Status", [])) > 0:
                status = [["All"]]
                for i in result["Status"]:
                    status.append([str(i)])
            else:
                status = [["Nothing to display"]]
            callback["status"] = status
            if len(result.get("GridType", [])) > 0:
                gridtype = [["All"]]
                for i in result["GridType"]:
                    gridtype.append([str(i)])
            else:
                gridtype = [["Nothing to display"]]
            callback["gridtype"] = gridtype
            if len(result.get("MaskStatus", [])) > 0:
                maskstatus = [["All"]]
                for i in result["MaskStatus"]:
                    maskstatus.append([str(i)])
            else:
                maskstatus = [["Nothing to display"]]
            callback["maskstatus"] = maskstatus
            if len(result.get("Site", [])) > 0:
                s = list(result["Site"])
                tier1 = gConfig.getValue("/WebApp/PreferredSites", [])
                site = [["All"]]
                for i in tier1:
                    site.append([str(i)])
                for i in s:
                    if i not in tier1:
                        site.append([str(i)])
            else:
                site = [["Error during RPC call"]]
            callback["site"] = site
            if len(result.get("Country", [])) > 0:
                country = [["All"]]
                countryCode = COUNTRIES
                for i in result["Country"]:
                    if i in countryCode:
                        j = countryCode[i]
                        country.append([str(j)])
            else:
                country = [["Nothing to display"]]
            country.sort()
            callback["country"] = country
        else:
            callback["status"] = [["Error during RPC call"]]
            callback["gridtype"] = [["Error during RPC call"]]
            callback["maskstatus"] = [["Error during RPC call"]]
            callback["site"] = [["Error during RPC call"]]
            callback["country"] = [["Error during RPC call"]]
        return callback

    def web_getData(self):
        pagestart = time()
        result = self.__request()
        gLogger.always(f"getSiteSummaryWeb({result},{self.globalSort},{self.pageNumber},{self.numberOfJobs})")
        retVal = WMSAdministratorClient().getSiteSummaryWeb(result, [], self.pageNumber, self.numberOfJobs)
        gLogger.always("\033[0;31m YO: \033[0m", result)
        if retVal["OK"]:
            if retVal["Value"].get("TotalRecords", 0) > 0:
                if "ParameterNames" in retVal["Value"] and "Records" in retVal["Value"]:
                    if len(retVal["Value"].get("ParameterNames", [])) > 0:
                        if len(retVal["Value"].get("Records", [])) > 0:
                            result = []
                            jobs = retVal["Value"]["Records"]
                            head = retVal["Value"]["ParameterNames"]
                            headLength = len(head)
                            countryCode = COUNTRIES
                            for i in jobs:
                                tmp = {head[j]: i[j] for j in range(headLength)}
                                tmp["FullCountry"] = countryCode[i[2]] if i[2] in countryCode else "Unknown"
                                result.append(tmp)
                            total = retVal["Value"]["TotalRecords"]
                            if "Extras" in retVal["Value"]:
                                extra = retVal["Value"]["Extras"]
                                result = {"success": "true", "result": result, "total": total, "extra": extra}
                            else:
                                result = {"success": "true", "result": result, "total": total}
                        else:
                            result = {"success": "false", "result": "", "error": "There are no data to display"}
                    else:
                        result = {"success": "false", "result": "", "error": "ParameterNames field is undefined"}
                else:
                    result = {"success": "false", "result": "", "error": "Data structure is corrupted"}
            else:
                result = {"success": "false", "result": "", "error": "There were no data matching your selection"}
        else:
            gLogger.always("- E R R O R -")
            result = {"success": "false", "error": retVal["Message"]}
        gLogger.info(f"\x1b[0;31m SITESUMMARY INDEX REQUEST: \x1b[0m {time() - pagestart}")
        return result

    def __request(self):
        req = {}

        if "id" in self.request.arguments:
            jobids = list(json.loads(self.get_argument("id")))
            if jobids:
                req["JobID"] = jobids

        elif len(self.get_argument("expand", [])) > 0:
            self.globalSort = [["GridSite", "ASC"]]
            self.numberOfJobs = 500
            self.pageNumber = 0
            req["ExpandSite"] = self.get_argument("expand", "")
        else:
            self.pageNumber = 0
            self.numberOfJobs = 500
            countries = list(json.loads(self.get_argument("country", "[]")))
            if countries:
                # Return the dictionary of country names and
                # corresponding country code top-level domain (ccTLD)
                code = dict(zip(COUNTRIES.values(), COUNTRIES))
                newValue = [code[i] for i in countries if i in code]
                req["Country"] = newValue

            site = list(json.loads(self.get_argument("site", "[]")))
            if site:
                req["Site"] = site

            status = list(json.loads(self.get_argument("status", "[]")))
            if status:
                req["Status"] = status

            maskstatus = list(json.loads(self.get_argument("maskstatus", "[]")))
            if maskstatus:
                req["MaskStatus"] = maskstatus

            gridtype = list(json.loads(self.get_argument("gridtype", "[]")))
            owner = list(json.loads(self.get_argument("owner", "[]")))
            if gridtype:
                req["GridType"] = gridtype
            elif owner:
                req["Owner"] = owner

            if self.get_argument("date", ""):
                req["LastUpdate"] = self.get_argument("date")

        gLogger.info("REQUEST:", req)
        return req
