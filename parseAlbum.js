var needle = require('needle');
var cheerio = require('cheerio');
var moment = require('moment');
var _ = require('lodash');
var mongoose = require('mongoose');
var AllModel = require('./all.js');

const uri = 'mongodb://212.109.221.239/da?retryWrites=true&w=majority';
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true});

var band = 'Cypecore';
var URL = 'https://www.metal-archives.com/albums/Cypecore/The_Alliance/695463';
let result = {
  songs: []
}

needle.get(URL, function(err, res){
  if (err) throw err;
  let $ = cheerio.load(res.body);
  let infoLeft = $('.float_left').find('dd');
  let infoRight = $('.float_right').find('dd');
  let bandName = $('.band_name > a').text();
  result.title = $('.album_name').text();
  result.type = infoLeft['0'].children[0].data;
  result.releaseDate = moment(infoLeft['1'].children[0].data, 'MMMM Do, YYYY').format('YYYY-MM-DD');
  if (infoRight['0'].children[0].data) {
    result.label = infoRight['0'].children[0].data;
  } else {
    result.label = infoRight['0'].children[0].children[0].data;
  }
  result.format = infoRight['1'].children[0].data;
  let numbers = [];
  let titles = [];
  let durations = [];
  $('.table_lyrics td[width="20"]').each((index, element) => {
    $(element.children).each((idx, elem) => {
      if (elem.data) {
        elem.data = elem.data.substring(0, elem.data.length-1)
        numbers.push(elem.data)
      }
    });
  });
  $('.table_lyrics .wrapWords').each((index, element) => {
    $(element.children).each((idx, elem) => {
      titles.push(elem.data.trim());
    });
  });
  $('.table_lyrics td[align="right"]').each((index, element) => {
    $(element.children).each((idx, elem) => {
      if (elem.data) {
        durations.push(elem.data);
      }
    });
  });
  for (let n in numbers) {
    let song = {
      number: parseInt(n)+1,
      title: titles[n],
      duration: durations[n]
    }
    result.songs.push(song)
  }
  result.duration = $('strong')['0'].children[0].data;
  result.cover = $('#cover')['0'].attribs.href;

  let names = [];
  let instruments = [];
  $('#album_members_lineup .lineupTable td[valign="top"] a').each((index, element) => {
    $(element.children).each((idx, elem) => {
      names.push(elem.data);
    });
  });

  $('#album_members_lineup .lineupTable tr[class="lineupRow"]').each((index, element) => {
    for (let i of element.children['3'].children) {
      instruments.push(i.data.trim());
    }
  });
  result.lineUp = _.zipWith(names, instruments, (name, actions)=> ({ name, actions}));
  AllModel.findOneAndUpdate({title: band}, {$push: {discography: result}}, {useFindAndModify: false}, (err, results) => {
    mongoose.connection.close();
  })
});


