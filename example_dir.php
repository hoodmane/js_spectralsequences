var example_list = <?php $out = array();
foreach (glob('examples/*.js') as $filename) {
    $p = pathinfo($filename);
    $out[] = $p['filename'];
}
echo json_encode($out); ?>;