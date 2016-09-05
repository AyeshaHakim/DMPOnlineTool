<?php

include 'print_tools.php';

$postdata = file_get_contents("php://input");
file_put_contents ('dmp.json',indent($postdata));
