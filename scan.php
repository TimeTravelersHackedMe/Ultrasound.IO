<?php
//path to directory to scan
$directory = "waveforms/";
 
//get all image files with a .jpg extension.
$images = glob($directory . "*.csv");
 
//print each file name
foreach($images as $image)
{
echo $image;
echo ",";
}
?>