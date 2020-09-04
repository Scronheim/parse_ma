var needle = require('needle');
var cheerio = require('cheerio');
var moment = require('moment');
var _ = require('lodash');
var mongoose = require('mongoose');
var AllModel = require('./all.js');

const uri = 'mongodb://212.109.221.239/da?retryWrites=true&w=majority';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true});

var URL = 'https://www.metal-archives.com/bands/Cypecore/3540276307';
let result = {
  bio: '',
  discography: [],
  socials: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  pictures: {}
}

needle.get(URL, function(err, res) {
  if (err) throw err;
  let $ = cheerio.load(res.body);
  result.title = $('.band_name > a').text();
  let infoLeft = $('.float_left').find('dd');
  let infoRight = $('.float_right').find('dd');
  result.country = infoLeft['0'].children[0].children[0].data;
  result.location = infoLeft['1'].children[0].data;
  result.status = infoLeft['2'].children[0].data;
  result.formedIn = infoLeft['3'].children[0].data;
  result.genre = infoRight['0'].children[0].data;
  result.lyricThemes = infoRight['1'].children[0].data;
  result.label = infoRight['2'].children[0].children[0].data;
  result.pictures.logo = $('#logo').attr('href');
  result.pictures.bandPic = $('#photo').attr('href');

  let names = [];
  let instruments = [];
  $('#band_tab_members_current .lineupTable td[valign="top"] a').each((index, element) => {
    $(element.children).each((idx, elem) => {
      names.push(elem.data);
    });
  });

  $('#band_tab_members_current .lineupTable tr[class="lineupRow"]').each((index, element) => {
    for (let i of element.children['3'].children) {
      instruments.push(i.data.trim());
    }
  });
  result.currentLineUp = _.zipWith(names, instruments, (name, actions)=> ({ name, actions}));

  AllModel.create(result,(err, results) => {
    mongoose.connection.close();
  });
});
