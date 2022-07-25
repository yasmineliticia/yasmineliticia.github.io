var app = angular.module("app")
.controller("mainController", ["$scope", "$http", "$rootScope", "$window", "printService", 'FileSaver', 'Blob', '$location', '$interval', '$timeout', function ($scope, $http, $rootScope, $window, printService, FileSaver, Blob, $location, $interval, $timeout) {
  $scope.establish_server_connections = function() {
    $scope.local_server = {
      name: "Local server",
      link: "http://localhost:8000",
    };
    $scope.socket = io.connect($scope.local_server.link, { 'force new connection': true } );
    
  };
  $scope.initiate_global_functions = function() {
    $scope.hide_left_navigator = function() {
    };
    $scope.innit_login = function() {    
    };
    $scope.hide_login = function() {
      jQuery("#divLogin").fadeOut(400, function() {
        jQuery("#divMain").fadeIn(400);
      });
    };
    if ($window.localStorage["ECG_userInfo"]) {
     if ($window.localStorage["ECG_should_hide_login"] == "yes") {
      $scope.hide_login();
    };
    };
    if ($window.localStorage["cassandra_userInfo"]) {
      $scope.userInfo = JSON.parse($window.localStorage["cassandra_userInfo"]);
      $scope.userInfo.account_type = "Primary user";
     if ($window.localStorage["cassandra_should_hide_login"] == "yes") {
       $scope.hide_login();
      };
    };
    $scope.change_to_large_screen_layout = function() {
      jQuery("#header_menu_button").hide();
      jQuery("#leftCollumn").show();
      jQuery("#rightCollumn").css({
        width: "calc(100vw - 308px)",
        left: 306,
      });
      $scope.hide_left_navigator();
    };
    $scope.getLength = function (array) {
      return array.length;
    };
  };
  $scope.initiate_global_functions();
}])

.controller("recordsController", ["$scope", "$http", "$rootScope", "$window", "printService", 'FileSaver', 'Blob', '$location', '$interval', '$timeout', 'dsp', function ($scope, $http, $rootScope, $window, printService, FileSaver, Blob, $location, $interval, $timeout, dsp) {
  $scope.establish_server_connections = function() {
    $scope.local_server = {
      name: "Local server",
      link: "http://localhost:8000",
    };
    $scope.socket = io.connect($scope.local_server.link, { 'force new connection': true } );
  };

  $scope.configure_on_pageload = function() {

  };
  $scope.handle_jquery_events = function() {
  };
  $scope.initiate_global_variables = function() {
    if (!$window.localStorage["cassandra_should_hide_login"]) {
      $window.localStorage["ECG_should_hide_login"] = "no";
    };
    $scope.ecg_data = [];
    $scope.file_content = [];
    $scope.record_name = "";
    $scope.record_comment = "";
    $scope.record_sampling_frequency = 100;
    $scope.plot_speed = 40;
    $scope.record_duration = Math.floor($scope.file_content.length / ($scope.record_sampling_frequency) * 10) / 10;
    $scope.record_date = new Date();
    $scope.ecg_bin = [];
    $scope.heartrate_bin = [];
    $scope.variability_bin = [];
    $scope.tmag_bin = [];
    $scope.stdeviation_bin = [];
    $scope.qrs_locs_bin = [];
    // FOR ANNOTATION GENERATOR
    $scope.heartrate_bin_ann = [];
    $scope.variability_bin_ann = [];
    $scope.tmag_bin_ann = [];
    $scope.stdeviation_bin_ann = [];
    $scope.qrs_locs_bin_ann = [];
    $scope.red_code = "#FF4081";
    // var orange_code = "#d17905";
    $scope.orange_code = "#FF9800";
    $scope.green_code = "#8BC34A";
    $scope.status_pool = ["Normal", "Brady", "Tarchy", "AF", "Arryth", "Ische", "Stroke", "Deadly"];
    $scope.colors_pool = [$scope.green_code, $scope.orange_code, $scope.red_code];
    $scope.annotations = [];
    $scope.annotations_statistic = [];
    $scope.chat_messages = [];
    $scope.ann_normal = "rgb(17,168,171)";
    $scope.ann_danger = "rgb(226,75,101)";
    $scope.ann_caution = "rgb(252,177,80)";
    $scope.ann_deep_red = "#F44336";
    $scope.ann_red = "#FF4081";
    $scope.ann_orange = "	#ffb234";
    $scope.ann_yellow = "#ffd834";
    $scope.ann_green = "#9fc05a";
    $scope.ann_lightgreen = "#add633";
    $scope.ann_blue = "#0057e7";
    $scope.ann_human = "rgb(255,139,90)";
    $scope.statistics_count = [0, 0, 0];
    $scope.loading_message = "Processing the signal. Please wait...";
    $scope.timer = 0;
    $scope.selected_index = -1;
  };
  $scope.innitiate_global_functions = function() {
    
    $scope.cancel_all_timeouts_and_intervals = function() {
      if ($scope.hover_record_timeout) {
        $timeout.cancel($scope.hover_record_timeout);
        $scope.hover_record_timeout = null;
      };
      if ($scope.timer_interval) {
        $interval.cancel($scope.timer_interval);
        $scope.timer_interval = null;
      };
    };
    $scope.display_record_statistics = function(index) {
        $scope.timer = 1;
        $scope.timer_interval = $interval(function() {
          if ($scope.timer > 0) {
            $scope.timer += 1;
          };
          if ($scope.timer == 6) {
            if ($scope.selected_index >= 0) {
              if (index != $scope.selected_index) {
                $scope.selected_record = $scope.records[index];
                $scope.init_chart($scope.selected_record.statistics[0], $scope.selected_record.statistics[1], $scope.selected_record.statistics[2]);
                $scope.cancel_all_timeouts_and_intervals();
                $scope.selected_index = index;
              }
            } else {
              $scope.selected_record = $scope.records[index];
              $scope.init_chart($scope.selected_record.statistics[0], $scope.selected_record.statistics[1], $scope.selected_record.statistics[2]);
              $scope.cancel_all_timeouts_and_intervals();
              $scope.selected_index = index;
            }
          };
        }, 160);
    };
   
    $scope.view_this_signal = function(record) {
      var index = $scope.records.indexOf(record);
      $window.localStorage["cassandra_command_lab_to_run_this_signal"] = JSON.stringify($scope.records[index]);
      $window.open("laboratory.html", "_blank", 'width=1260,height=760');
    };
    $scope.analize_this_signal = function(record) {
      var index = $scope.records.indexOf(record);
      $window.localStorage["ECG_command_analysis_to_run_this_signal"] = JSON.stringify($scope.records[index]);
      $window.open("analysis_2.html", "_blank", 'width=1260,height=760');
    };
    $scope.delete_this_record = function(index) {
      if (confirm("Delete record " + $scope.records[index].name + "?")) {
        jQuery("#page_loading").show();
        if (index == $scope.records.length - 1) {
          $scope.selected_record = {
            name: "No records hovered",
            statistics: [0, 0, 0],
          };
          $scope.init_chart($scope.selected_record.statistics[0], $scope.selected_record.statistics[1], $scope.selected_record.statistics[2]);
        } else {
          $scope.selected_record = $scope.records[index + 1];
          $scope.init_chart($scope.selected_record.statistics[0], $scope.selected_record.statistics[1], $scope.selected_record.statistics[2]);
        };

        $scope.cancel_all_timeouts_and_intervals();

        $scope.selected_index = index;

        $scope.record = $scope.records[index];
        var record_data_id = $scope.record.record_id;

        $window.localStorage.removeItem(record_data_id);

        console.log("Remove item: " + record_data_id);

        $scope.records.splice(index, 1);
        $window.localStorage["cassandra_records"] = JSON.stringify($scope.records);

        jQuery("#page_loading").hide();

        $scope.cancel_custom_timeout();
      };
    };
    $scope.importPackageFromTextFile = function($fileContent) {
      jQuery("#page_loading").show();
      $scope.custom_timeout = $timeout(function() {
        var fullPath = document.getElementById('file-upload').value;
        var filename = "";
        if (fullPath) {
          filename = fullPath.replace(/^.*?([^\\\/]*)$/, '$1');
          filename = filename.substring(0, filename.lastIndexOf('.'));
        };
        var result = [];
        var lines = $fileContent.split('\n');
        for(var line = 2; line < lines.length - 1; line++) {
          values = lines[line].split(/[ ,;\t ]+/).filter(Boolean);
          if (values.length == 1) {
            result.push(values);
          } else {
            var number_of_leads = values.length;
            result.push(values[number_of_leads - 1]);
          };
        };
        $scope.file_content = "";
        var value_to_devine = dsp.find_max(result);
        for (var loop = 0; loop < result.length - 1; loop++) {
          result[loop] = Math.floor(result[loop] / value_to_devine * 1000) / 1000;
          $scope.file_content += (result[loop] + "\n");
        };
        result[result.length - 1] = Math.floor(result[result.length - 1] / value_to_devine * 1000) / 1000;
        $scope.file_content += (result[result.length - 1]);
        $scope.ecg_data = result;
        $scope.record_name = filename;
        $scope.record_duration = Math.floor($scope.ecg_data.length / ($scope.record_sampling_frequency) * 10) / 10;
        jQuery("#page_loading").hide();
        $scope.cancel_custom_timeout();
      }, 200);
    };
    $scope.update_duration = function() {
      $scope.record_duration = Math.floor($scope.ecg_data.length / ($scope.record_sampling_frequency) * 10) / 10;
    };
    $scope.update_ecg_data_and_duration = function() {
      var result = [];
      var lines = $scope.file_content.split('\n');
      for(var line = 2; line < lines.length; line++) {
        values = lines[line].split(/[ ,;\t ]+/).filter(Boolean);
        if (values.length == 1) {
          result.push(values);
        } else {
          var number_of_leads = values.length;
          result.push(values[number_of_leads - 1]);
        };
      };
      $scope.file_content = "";
      for (var loop = 0; loop < result.length - 1; loop++) {
        $scope.file_content += (result[loop] + "\n");
      };
      $scope.file_content += (result[result.length - 1]);
      $scope.ecg_data = result;
      $scope.record_duration = Math.floor($scope.ecg_data.length / ($scope.record_sampling_frequency) * 10) / 10;
    };
    $scope.open_popup_upload_record = function() {
      $scope.loading_message = "Processing the signal. Please wait...";
      jQuery("#upload_record_popup").show();
      jQuery("#upload_record_popup > form > .div_small_popup").animate({
        top: 100,
        opacity: 1
      }, 400);
    };
    $scope.close_popup_upload_record = function() {
      $scope.file_content = [];
      $scope.record_name = "";
      $scope.record_comment = "";
      $scope.record_sampling_frequency = 100;
      $scope.record_duration = Math.floor($scope.file_content.length / ($scope.record_sampling_frequency) * 10) / 10;
      $scope.record_date = new Date();
      $scope.custom_timeout = $timeout(function () {
        jQuery("#upload_record_popup > form > .div_small_popup").animate({
          top: 140,
          opacity: 0
        }, 400, function() {
          jQuery("#upload_record_popup").hide();
        });
        $scope.cancel_custom_timeout();
      }, 160);
    };
    $scope.save_this_record = function() {
      $scope.loading_message = "Processing the signal. Please wait...";
      jQuery("#page_loading").show();
      $scope.custom_timeout = $timeout(function() {
        $scope.ecg_bin = $scope.ecg_data;
        $scope.down_sampling_value = Math.floor($scope.record_sampling_frequency / $scope.plot_speed);
        for (i = 0; i < $scope.ecg_bin.length; i ++) {
          $scope.ecg_bin[i] = $scope.ecg_bin[i] * 1000;
        };
        var value = dsp.cal_mean($scope.ecg_bin);
        for (i = 0; i < $scope.ecg_bin.length; i ++) {
          $scope.ecg_bin[i] = $scope.ecg_bin[i] - value;
        };
        $scope.ecg_bin = dsp.noise_removal_using_low_pass_filter($scope.ecg_bin);
        $scope.ecg_bin = dsp.smooth_signal_with_moving_avarage(4, $scope.ecg_bin);
        $scope.ecg_bin = dsp.down_sampling($scope.down_sampling_value, $scope.ecg_bin);
        $scope.ecg_bin = dsp.baseline_remove_using_moving_average($scope.ecg_bin);
        $scope.generate_annotations_for_this_segment();
        $scope.new_record = {
          name: $scope.record_name,
          date: $scope.record_date,
          uploaded_by: $scope.userInfo.email + "-desktop",
          record_id: "record__" + Math.floor(Math.random() * 1000000) + "__" + $scope.record_name.split(' ').join('_') + "__" + $scope.record_comment.split(' ').join('_'),
          data_link: $scope.local_server.link + "\\bin\\saved-records\\" + $scope.record_name.split(' ').join('_') + ".txt",
          description: $scope.record_comment,
          clinical_symptoms: {
            chest_pain: false,
            shortness_of_breath: false,
            severe_sweating: false,
            dizziness: false,
          },
          statistics: $scope.transform_statistics($scope.statistics_count),
          send_to_doctor: false,
          user_info: JSON.parse($window.localStorage["cassandra_userInfo"]),
        };
        $scope.record_data = {
          record_id: $scope.new_record.record_id,
          sampling_frequency: $scope.record_sampling_frequency,
          data: $scope.ecg_data,
          user_info: JSON.parse($window.localStorage["cassandra_userInfo"]),
        };
        $scope.records.push($scope.new_record);
        $window.localStorage["cassandra_records"] = JSON.stringify($scope.records);
        $window.localStorage[$scope.record_data.record_id] = JSON.stringify($scope.record_data);
        alert("Record uploaded successfully");
        jQuery("#page_loading").hide();
        $scope.cancel_custom_timeout();
        $scope.close_popup_upload_record();

        var package_to_database_server = {
          record_info: $scope.new_record,
          record_data: $scope.record_data,
          user_info: $scope.userInfo,
        };
        $scope.heroku_socket.emit("save_this_record_directly_to_database_server", package_to_database_server);
      }, 1600);
    };
    $scope.transform_statistics = function(array) {
      var total = array[0] + array[1] + array[2];
      array[0] = Math.floor(array[0] / total * 100);
      array[1] = Math.floor(array[1] / total * 100);
      array[2] = 100 - array[0] - array[1];
      return array;
    };
    $scope.init_chart = function(normal, risk, danger) {
      var chart = new Chartist.Pie('.ct-chart', {
        series: [normal, risk, danger],
        labels: ["Normal", "Risk", "Danger"]
      }, {
        donut: true,
        donutWidth: 56,
        startAngle: 340,
        showLabel: false
      });
      chart.on('draw', function(data) {
        if(data.type === 'slice') {
          // Get the total path length in order to use for dash array animation
          var pathLength = data.element._node.getTotalLength();

          // Set a dasharray that matches the path length as prerequisite to animate dashoffset
          data.element.attr({
            'stroke-dasharray': pathLength + 'px ' + pathLength + 'px'
          });

          // Create animation definition while also assigning an ID to the animation for later sync usage
          var animationDefinition = {
            'stroke-dashoffset': {
              id: 'anim' + data.index,
              dur: 900,
              from: -pathLength + 'px',
              to:  '0px',
              easing: Chartist.Svg.Easing.easeOutQuint,
              // We need to use `fill: 'freeze'` otherwise our animation will fall back to initial (not visible)
              fill: 'freeze'
            }
          };

          // If this was not the first slice, we need to time the animation so that it uses the end sync event of the previous animation
          if(data.index !== 0) {
            animationDefinition['stroke-dashoffset'].begin = 'anim' + (data.index - 1) + '.end';
          }

          // We need to set an initial value before the animation starts as we are not in guided mode which would do that for us
          data.element.attr({
            'stroke-dashoffset': -pathLength + 'px'
          });

          // We can't use guided mode as the animations need to rely on setting begin manually
          data.element.animate(animationDefinition, false);
        }
      });

      // For the sake of the example we update the chart every time it's created with a delay of 8 seconds
      chart.on('created', function() {
        if(window.__anim21278907124) {
          clearTimeout(window.__anim21278907124);
          window.__anim21278907124 = null;
        };

      });
    };
    
    $scope.generate_annotation_for_this_beat = function(hr, hrv, std, tp, loc, beat, left) {
      var obj = {
        text: null,
        color: null,
        tooltip: null,
        qrs_loc: loc,
        beat_num: beat,
        left: left,
      };
      if (std >= 35 && tp >= 80) {
        $scope.statistics_count[2] += 1;
        obj.text = "ST+";
        obj.color = $scope.ann_danger;
        obj.tooltip = "<b>ST Elevation</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        return obj;
      };
      if (std <= -20 && tp <= -20) {
        $scope.statistics_count[2] += 1;
        obj.text = "ST-";
        obj.color = $scope.ann_danger;
        obj.tooltip = "<b>ST Depression</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        return obj;
      };
      if (tp >= 160 && hr <= 70 && std < 35) {
        $scope.statistics_count[1] += 1;
        obj.text = "PVC";
        obj.color = $scope.ann_human;
        obj.tooltip = "<b>Premature Ventricular Complex</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        return obj;
      } else {
        if (hrv >= 20 && hr <= 70 && tp < 0) {
          $scope.statistics_count[1] += 1;
          obj.text = "PVC";
          obj.color = $scope.ann_human;
          obj.tooltip = "<b>Premature Ventricular Complex</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
          return obj;
        }
      }
      if (hrv >= 10 && (hr >= 120 || hr <= 70)) {
        $scope.statistics_count[1] += 1;
        obj.text = "ARR";
        obj.color = $scope.ann_caution;
        obj.tooltip = "<b>Arrythmia</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        return obj;
      };

      if (tp <= -5) {
        $scope.statistics_count[1] += 1;
        obj.text = "T-";
        obj.color = $scope.ann_caution;
        obj.tooltip = "<b>T Inverted</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        return obj;
      };

      if (tp >= 100) {
        $scope.statistics_count[1] += 1;
        obj.text = "T+";
        obj.color = $scope.ann_caution;
        obj.tooltip = "<b>T Peaked</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        return obj;
      };

      if (std <= -8 || std >= 20) {
        $scope.statistics_count[1] += 1;
        obj.color = $scope.ann_red;
        if (std <= -8) {
          obj.text = "SD-";
          obj.tooltip = "<b>Negative ST Deviation</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        } else {
          obj.text = "SD+";
          obj.tooltip = "<b>Positive ST Deviation</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        }
        return obj;
      };
      if (hr >= 140) {
        $scope.statistics_count[1] += 1;
        obj.text = "TAR";
        obj.color = $scope.ann_human;
        obj.tooltip = "<b>Tarchycardia</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        return obj;
      };

      if (hr <= 50) {
        $scope.statistics_count[1] += 1;
        obj.text = "BRA";
        obj.color = $scope.ann_human;
        obj.tooltip = "<b>Bradycardia</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        return obj;
      };
      if (tp >= -5 && tp <= 5) {
        $scope.statistics_count[1] += 1;
        obj.text = "T0";
        obj.color = $scope.ann_caution;
        obj.tooltip = "<b>T Absence</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        return obj;
      };
      if (tp > 5 && hr > 40 && hr < 140 && hrv < 10 && std > -8 && std < 20) {
        $scope.statistics_count[0] += 1;
        obj.text = "N";
        obj.color = $scope.ann_normal;
        obj.tooltip = "<b>Normal</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
        return obj;
      };
      $scope.statistics_count[0] += 1;
      obj.text = "M";
      obj.color = $scope.ann_green;
      obj.tooltip = "<b>Missed Beat</b><br/><ul><li>HR:  " + hr + "</li><li>T:  " + tp + "%</li><li>STD:  " + std + "%</li></ul>";
      return obj;
    };
    $scope.generate_annotations_for_this_segment = function() {
      var qrs_locs = dsp.qrs_detect(40, $scope.ecg_bin);
      $scope.qrs_locs_bin_ann = qrs_locs;
      var hr_bin = dsp.calculate_heart_rates(40, $scope.ecg_bin, qrs_locs);
      var hrv_bin = [];
      var t_result = dsp.t_peaks_detect(40, $scope.ecg_bin, qrs_locs);
      var tp_bin = t_result[0];
      var tlocs = t_result[1];
      var std_bin = dsp.std_detect(40, $scope.ecg_bin, qrs_locs, tlocs);
      for (var loop = 0; loop < hr_bin.length; loop++) {
        var segment = [];
        var span = 3;
        for (var ind = -1; ind < (span - 1); ind++) {
          if (hr_bin[loop + ind]) {
            segment.push(hr_bin[loop + ind]);
          } else {
            segment.push(hr_bin[loop + ind - span]);
          };
        };
        hrv_bin.push(dsp.cal_std(segment));
      };
      $scope.heartrate_bin_ann = hr_bin;
      $scope.variability_bin_ann = hrv_bin;
      $scope.tmag_bin_ann = tp_bin;
      $scope.stdeviation_bin_ann = std_bin;
      for (var beat_ind = 0; beat_ind < hr_bin.length; beat_ind++) {
        var hrv = hrv_bin[beat_ind];
        var hr = hr_bin[beat_ind];
        var std = std_bin[beat_ind];
        var tp = tp_bin[beat_ind];
        var margin_left_value = (qrs_locs[beat_ind] - 2) / $scope.ecg_bin.length * (jQuery("#ecg_chart_container").width() * $scope.window_percentage / 100 + 60) - (qrs_locs[beat_ind] - 2) / $scope.ecg_bin.length * 66;
        var result = $scope.generate_annotation_for_this_beat(hr, hrv, std, tp, qrs_locs, beat_ind, margin_left_value);
        $scope.annotations.push(result);
      };
      var len = $scope.annotations.length;
      var last_ann = {
        text: $scope.annotations[len - 1].text,
        color: $scope.annotations[len - 1].color,
        tooltip: $scope.annotations[len - 1].tooltip,
        qrs_loc: 2 * $scope.annotations[len - 1].qrs_loc - $scope.annotations[len - 2].qrs_loc,
        beat_num: $scope.annotations[len - 1].beat_num + 1,
        left: 2 * $scope.annotations[len - 1].left - $scope.annotations[len - 2].left,
      }
      $scope.annotations.push(last_ann);
      console.log("qrs:" + qrs_locs.length + "-hr:" + hr_bin.length + "-ann:" + $scope.annotations.length);
    };
    $scope.cancel_custom_timeout = function() {
      if ($scope.custom_timeout) {
        $timeout.cancel($scope.custom_timeout);
        $scope.custom_timeout = null;
      };
    };
  };
  $scope.establish_server_connections();
  $scope.initiate_global_variables();
  $scope.configure_on_pageload();
  $scope.innit_login();
  $scope.handle_jquery_events();
  $scope.innitiate_global_functions();
  jQuery("#upload_record_popup").hide();
  jQuery("#smallPopup_uploadRecord").tinyDraggable({ handle: '.header' });

  $scope.custom_timeout = $timeout(function() {
    if ($window.localStorage["cassandra_records"]) {
      $scope.records = JSON.parse($window.localStorage["cassandra_records"]);
      jQuery("#loading_records_spinner").hide();
    } else {
      $scope.records = [];
      jQuery("#loading_records_spinner").hide();
    };
    $scope.cancel_custom_timeout();
  }, 1600);
  $scope.selected_record = {
    name: "No records hovered",
    statistics: [0, 0, 0],
  };
}]);
