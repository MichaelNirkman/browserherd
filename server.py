from flask import Flask, request, Response
from flask_restful import Api 
from flask_cors import CORS

import logging

app=Flask(__name__)
api=Api(app)
CORS(app)

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

site_state = {"active": False, "location":"", "scroll":0}

class bcolors:
    OKGREEN = '\033[92m'
    ENDC = '\033[0m'


@app.route('/update_location', methods=['PUT'])
def update_datacontents():
    global site_state
    content = request.get_json(silent=True)

    if content is not None and "location" in content and "scroll" in content:
        loc = content["location"]
        scr = content["scroll"]
    else:
        resp = Response('{"message": "Please supply a valid JSON body"}', status=400, mimetype="application/json")
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp

    if  loc != site_state["location"]:
        site_state = {"active": True, "location": loc, "scroll":scr}
        print(f'{bcolors.OKGREEN}New location: {site_state["location"]}{bcolors.ENDC}')
        resp = Response('{"message": "Location updated successfully"}', status=200, mimetype="application/json")
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp
    elif loc == site_state["location"]:
        site_state["scroll"] = scr
        resp =  Response('{"message": "Location unchanged"}', status=200, mimetype="application/json")
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp
    else:
        resp = Response('{"message": "Not sure what to do with this payload"}', status=400, mimetype="application/json")
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp

@app.route('/get_location', methods=['GET'])
def get_location():
    global site_state
    if site_state["active"]:
        resp =  Response(f'{{"location": "{site_state["location"]}", "scroll": {site_state["scroll"]}, "active": true}}', status=200, mimetype="application/json")
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp
    else:
        resp = Response(f'{{"message": "There is nothing to follow yet", "active": false}}', status=201, mimetype="application/json")
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp

if __name__ == '__main__':
    app.run(port=6501)
