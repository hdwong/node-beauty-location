"use strict";
let core, config, logger, _ = require('lodash'), qqwry = require('lib-qqwry')(true),
    parents = {}, data = {}, provinces = {};

let serviceName = 'location';
let location = {
  assert: (error) => {
    if (error) {
      logger.error(error);
      throw '[' + serviceName + '] ' + error;
    }
  },
  init: (name, c) => {
    serviceName = name;
    core = c;
    logger = core.getLogger(serviceName);
    config = core.getConfig(serviceName);
    // load location.data
    let fs = require('fs');
    parents = JSON.parse(fs.readFileSync(__dirname + '/location-parent.json'));
    data = JSON.parse(fs.readFileSync(__dirname + '/location.json'));
    provinces = JSON.parse(fs.readFileSync(__dirname + '/location-province.json'));
  },
  get_default: (req, res, next) => {
    if (req.query.id === undefined) {
      throw 'Params is wrong';
    }
    let ids = req.query.id.split(','), result = {};
    core.forEach(ids, (id) => {
      if (data[id] !== undefined) {
        let r = data[id];
        result[id] = {
          name: r[0],
          fullname: r[1],
          post: r[2],
          tele: r[3]
        };
      } else {
        result[id] = null;
      }
    }, () => {
      next(result);
    });
  },
  get_children: (req, res, next) => {
    let id = req.query.id === undefined ? '0' : req.query.id;
    if (parents[id] !== undefined) {
      let children = {}, p = parents[id], len = p.length, i;
      for (i = 0; i < len; ++i) {
        children[p[i]] = data[p[i]][0];
      }
      return next(children);
    }
    next(null);
  },
  get_ip: (req, res, next) => {
    if (req.query.ip === undefined) {
      throw 'Params is wrong';
    }
    let info = qqwry.searchIP(req.query.ip);
    info.country = info.Country;
    delete info.Country;
    info.area = info.Area;
    delete info.Area;
    // get province
    let country = info.country, province = false;
    if (_.includes([ '香港', '澳门', '台湾', '新疆', '西藏', '宁夏', '广西' ], country.substr(0, 2))) {
      province = country.substr(0, 2);
    } else if (country.substr(0, 3) == '内蒙古') {
      province = '内蒙古';
    } else if (province = country.match('^(.+?)(?:省|市)')) {
      province = province[1];
    }
    info.province = (province && provinces[province] !== undefined) ?
        provinces[province] : null;
    next(info);
  }
};

module.exports = location;
