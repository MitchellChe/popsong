const clientID = '';
const secret = '';

// Token for CC auth flow, not for accessing user info
async function getToken(){      
    const token_URL = 'https://accounts.spotify.com/api/token';                                 
    const result = await fetch(token_URL, {
        method: 'POST',
        headers: {
            'Content-Type':'application/x-www-form-urlencoded',
            'Authorization' : 'Basic '+btoa(clientID+":"+secret) //<base 64 encoded client id:client secret string>
        },
        body: 'grant_type=client_credentials'
    }).catch(function(error){
        console.log(error);
    });

    const data = await result.json();
    return data.access_token;
}

var top200 = '';

async function getGlobalCharts(){

    const proxyurl = 'https://cors-anywhere.herokuapp.com/';                   //CORS Proxy
    const url = 'https://spotifycharts.com/regional/us/daily/latest/download'; //Daily US top 200 from spotifycharts.com
    const response = await fetch(proxyurl+url);    
    const data = await response.text();
    top200 = data.split('\n').slice(2).slice(0,200);
}

function loadGame(){
    
    //Hide buttons
    document.getElementById('nextButton').style.display = 'none';
    document.getElementById('startOverButton').style.display = 'none';

    var tracks = top200;

    // Shuffle array of top200 tracks using Fisher-Yates algorithm
    // to randomly select 2 tracks
    function shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }

    rows = shuffle(tracks);
    const tracka = getObj(rows[0]);
    const trackb = getObj(rows[1]);
    //IFFE to getTrackInfo
    (async function getTrackInfo(){
        
        const ids = tracka.trackID+","+trackb.trackID;
        token = await getToken();

        const result = await fetch(`https://api.spotify.com/v1/tracks/?ids=${ids}`, {
            method: 'GET',
            headers: {'Authorization' : 'Bearer '+token}
        }).catch(function(error){
            console.log(error);
        });
    
        const data = await result.json();
        tracka.info = data.tracks[0];
        trackb.info = data.tracks[1];
        
        loadHTML(tracka,trackb);
        
    })();



}

function loadHTML(tracka, trackb){

    //Clear out divs
    const afield = document.getElementById('fielda');
    const bfield = document.getElementById('fieldb');
    afield.innerHTML = '';
    bfield.innerHTML = ''
    

    function htmlField(track,ab){

        // For some reason CSV from Spotify is inconsistent in using quotation marks around song name/artist
        // so just use data from API (.info) for consistency
        const html = 
        `
        <img src="${track.info.album.images[1].url}" id=${ab} class="album_art clickable" alt="${track.info.album.name} album cover">
        <br>
        <p id="track-info">
            <b>${track.info.name}</b>
            <br>
            ${track.info.artists[0].name}
        </p>
        `;
        return html;
    }

    afield.insertAdjacentHTML('beforeend',htmlField(tracka,'tracka'));
    bfield.insertAdjacentHTML('beforeend',htmlField(trackb,'trackb'));

    document.getElementById('tracka').addEventListener("click",checkA);
    document.getElementById('trackb').addEventListener("click",checkB);

    function checkA(){
        if(tracka.dailyStreams>trackb.dailyStreams){

            alert('Correct!');
            document.getElementById('nextButton').style.display = 'block';

        }
        else{

            alert('incorrect :(');
            document.getElementById('nextButton').style.display = 'block';
            //for when score is implemented    document.getElementById('button-box').insertAdjacentHTML('afterbegin', startOverHTML);

        }
        document.getElementById('tracka').removeEventListener("click",checkA);
        document.getElementById('trackb').removeEventListener("click",checkB);
        afield.insertAdjacentHTML('beforeend',getStatField(tracka));
        bfield.insertAdjacentHTML('beforeend',getStatField(trackb));
        document.getElementById('tracka').classList.remove('clickable');
        document.getElementById('trackb').classList.remove('clickable');

    }

    function checkB(){

        if(trackb.dailyStreams>tracka.dailyStreams){

            alert('Correct!');
            document.getElementById('nextButton').style.display = 'block';

            
        }
        else{

            alert('incorrect :(');
            document.getElementById('nextButton').style.display = 'block';
            //for when score is implemented    document.getElementById('button-box').insertAdjacentHTML('afterbegin', startOverHTML);

        }
        document.getElementById('tracka').removeEventListener("click",checkA);
        document.getElementById('trackb').removeEventListener("click",checkB);
        afield.insertAdjacentHTML('beforeend',getStatField(tracka));
        bfield.insertAdjacentHTML('beforeend',getStatField(trackb));  
        document.getElementById('tracka').classList.remove('clickable');
        document.getElementById('trackb').classList.remove('clickable');

    }

    function getStatField(track){
        
        const html = 
        `
            <div class = 'track-stats'>
            <p>
                Chart Position: ${track.position}
                <br>
                Daily Streams: ${track.dailyStreams.toLocaleString()}
            </p>
            </div>
        `;
        return html;
    }

}

//Function for getting track object from track array
function getObj(element){

    console.log(element);
    const arr = element.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); //Parse CSV row to string arr
    var track = {};
    track.position = parseInt(arr[0]);
    track.title = arr[1];
    track.artist = arr[2];
    track.dailyStreams = parseInt(arr[3]);
    track.trackID = arr[4].replace('https://open.spotify.com/track/','');
    return track;

}

async function main(){

    await getGlobalCharts();
    loadGame();

}

main();