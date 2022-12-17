import express from "express";

const { NICKNAME, BLOB_BASE_URL, EMBED_SERVER_PORT } = process.env;

const httpBaseUrl = BLOB_BASE_URL.replace("https://", "http://");
const httpsBaseUrl = BLOB_BASE_URL.replace("http://", "https://");


const template: string = 
`
<!DOCTYPE html>
<html>
<meta property="og:type" content="video.movie">
<meta property="og:url" content="">
<meta property="og:video" content="${httpBaseUrl}VIDURL.mp4" />
<meta property="og:video:type" content="video/mp4" />
<meta property="og:video:secure_url" content="${httpsBaseUrl}VIDURL.mp4" />
<meta property="og:video:type" content="video/mp4" />
<meta property="og:title" content="${NICKNAME} bot video">
<meta property="og:description"  content="This video was uploaded via ${NICKNAME}, the helpful little discord bot!"/>
<meta property="og:site_name" content="${NICKNAME} Bot">
<body>
<style type="text/css">
video {
   width:100%;
   max-width:600px;
   height:auto;
}
</style>
<video width="100%" src="${httpsBaseUrl}VIDURL.mp4" controls>
 Your browser does not support video
</video>
</body>
</html>
`

export const startServer = () => {
    const app = express();
    app.get('/*', function (req, res) {
        const path = req.path.replace("/daisy/", ""); //Fixes issue on local instance with reverse proxy... To be looked at eventually.
        res.send(template.replaceAll("VIDURL", path));
      });
      app.listen(EMBED_SERVER_PORT);
}
