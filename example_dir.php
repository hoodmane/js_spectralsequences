<?php

        function console_log( $data ){
                echo 'console.log('. json_encode( $data ) .');';
        }

        $files = glob('js_spectralsequences/examples/*.js');

        $out = array();
        $name_dict = array();
        $n = -1;
        foreach ($files as $file){
            $n++;
            $filemap = array();
            $filename = pathinfo($file)['filename'];
            $fileproperties = array();
            $file_handle = fopen($file, "r");
            $line = fgets($file_handle);
            while(substr($line,0,2)=="//"){
                $pos = strpos($line, ":");
                if($pos !== false) {
                        $fileproperties[strtolower(trim(substr($line,2,$pos-2)))] = trim(substr($line,$pos+1));
                }
                $line = fgets($file_handle);
            }
            if(array_key_exists("name", $fileproperties)) {
                $filemap["name"] = $fileproperties["name"];
            } else {
                $filemap["name"] = $filename;
            }
            $filemap['filename'] = $filename;
            $filemap['path'] = $file;
            $filemap['href'] = "?sseq=" . $filename;
            $filemap['properties'] = $fileproperties;
            $filemap['idx'] = $n;
            $out[]  = $filemap;
            $name_dict[$filemap["name"]] = $filemap;
        }

        $files = glob('*.tex');


        foreach ($files as $file){
            $filemap = array();
            $filename = pathinfo($file)['filename'];
            $fileproperties = array();
            $file_handle = fopen($file, "r");
            $line = fgets($file_handle);
            while(substr($line,0,2)=="%%"){
                $pos = strpos($line, ":");
                if($pos !== false) {
                        $fileproperties[strtolower(trim(substr($line,2,$pos-2)))] = trim(substr($line,$pos+1));
                }
                $line = fgets($file_handle);
            }
            $filemap['filename'] = $filename;
            if(array_key_exists("name", $fileproperties)) {
                $filemap["name"] = $fileproperties["name"];
            } else {
                $filemap["name"] = $filename;
            }
            if(array_key_exists($filemap["name"], $name_dict)){
                   $filemap = $name_dict[$filemap["name"]];
                   $filemap['pdf_href'] = $filename . ".pdf";
                   $filemap['source_href'] = $filename;
                   $filemap['properties'] = $fileproperties;
                   $out[$filemap['idx']] = $filemap;
            } else {
                    $filemap['path'] = $file;
                    $filemap['href'] = $filename . ".pdf";
                    $filemap['source_href'] = $filename;
                    $filemap['properties'] = $fileproperties;
                    $out[]  = $filemap;
            }
        }

        echo "var example_list = " . json_encode($out);
?>; 