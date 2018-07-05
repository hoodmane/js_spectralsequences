var example_list = <?php 
        $files = array();
        foreach (glob('js_interactive_sseq/examples/*.js') as $filename) {
            $files[] = $filename;
        }

        $thelist = "";
        sort($files);
        $out = array();
        foreach ($files as $file){
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
        
            $filemap['filename'] = $filename;
            $filemap['path'] = $file;
            $filemap['properties'] = $fileproperties;
            $out[]  = $filemap;
        }
        
        echo json_encode($out);
?>;