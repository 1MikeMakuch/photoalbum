
var baseQuery = 'http://mike.makuch.org:10101/query/';
baseQuery = 'http://localhost:10101/query/';
var baseUrl = 'http://localhost:10101/';

function mybutton (dir, album, buttonLabel) {
    var link = (dir ? dir+'/' : '') + album['dir'];
//    console.log('link',link);

    // swap button and block, removes the visible border that comes from the button around the image
    var html = `
        <div class="outerblock">
            <button class="photo" onclick="photoalbum('` + link + `');">
                <div class="block">` + buttonLabel + `</div>
                <br>` + link + `
            </button>
        </div>`;
    return html;
}

$(document).ready(function(){
    var dir='';
    photoalbum(dir);
});

function createBreadcrumbs(arg) {
    var dirs = arg.split('/');
    var breadcrumbs = '';
    var link = '';
    dirs.forEach(function(dir) {
        link += (link ? '/' : '') + dir;
        breadcrumbs += (breadcrumbs ? ' / ' : '') + `<a href="#" onclick="photoalbum('` + link + `');">` + dir + `</a>`;
        console.log('bc',breadcrumbs);
    });

    return breadcrumbs;
}

function photoalbum(dir) {

    console.log('photoalbum',dir);


    $("#breadcrumbs").html(createBreadcrumbs(dir));

    var query = baseQuery + dir;

    $.ajax({url: query, success: function(result) {
//        console.log('ajax',result);
        var tag="";
        if ("album" == result.type) {
            result.results.forEach(function(album) {
//                console.log(album);
                // var pic = img['image'].replace('albums/','');
                tag += mybutton(dir, album, `<img src="` + baseUrl + album['image'] + `" >\n`);
            });
        } else if ("chapter" == result.type) {
            result.results.forEach(function(img) {
//                console.log(img);
                // var pic = img['image'].replace('albums/','');
               tag += `<div class="outerblock"><div class="block"><img src="` + baseUrl + img + `" ></div></div>\n`;
            })
        }
//        console.log(tag);
        $("#photos").html(tag);
    }});

};
