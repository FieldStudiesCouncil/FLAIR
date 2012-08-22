;(function(FLAIR, Backbone, _, $) {

	_.extend(FLAIR, {
		// Add the crossSection visualisation to the 
		// FLAIR.visualisations object
		visualisations: _.extend(FLAIR.visualisations, {
				riverCrossSection: function(charts){
					visualiseCrossSection(charts);
				}
		})
	});

	function visualiseCrossSection(charts) {
		// charts is an array of chart objects which look like:
		// {
		//   id: the div id for this chart
		//	 models: an array of Experiment Backbone models with data.measurement attributes to chart
		// }
		var maxWidth, maxDepth = 0, plots = [];

		// Show the loading message because this takes a while on some
		// slow phones
		$.mobile.showPageLoadingMsg();

		// Pull out the valid charts and add some values to them
		var validCharts = _.map(charts, function(chart, key, list){
			var wetWidthModel = _.find(chart.models, function(experiment) {
				return experiment.get("experimentType") === "Wet Width"; 
			});

			var depthMeasurementsModel = _.find(chart.models, function(experiment) {
				return experiment.get("experimentType") === "Wet Water Depth"; 
			}); 

			if(!_.isUndefined(wetWidthModel) && !_.isUndefined(depthMeasurementsModel)) {
				
				var wetWidth = parseInt(wetWidthModel.get("data").measurement, 10);
				var depthMeasurements = _.map(depthMeasurementsModel.get("data").measurement, function(depth) {
					return parseInt(depth, 10);
				});

				// Calculate a running maximum for the width so that we can graph
			    // all of them on the same scale for better science!
			    maxWidth = wetWidth > maxWidth ? wetWidth : maxWidth;
			    maxDepth = _.max(depthMeasurements) > maxDepth ? _.max(depthMeasurements) : maxDepth;

			    return {
			    	id: chart.id,
			    	title: chart.site.get("location").name,
			    	wetWidth: wetWidth,
			    	depthMeasurements: depthMeasurements,
			    }
			}
		});

		// Set a "postDraw" callback so that we can turn off the loading image
		// after the last graph 
		$.jqplot.postDrawHooks.push(function (){
			if(this.targetId === "#" + _.last(validCharts).id) {
				$.mobile.hidePageLoadingMsg();
			}
		});
		
		// Draw them all
		plots = createAllCrossSections(validCharts, maxDepth, maxWidth);

		// Bind to orientationchange and resize events to redraw the graphs
		$(window).on("orientationchange, resize", function(e) {
			$.mobile.showPageLoadingMsg();
			// Remove each old plot
			_.each(plots, function(plot) {
				plot.destroy();
				$(plot.targetId).empty();
			});
			// Add in new ones
			plots = createAllCrossSections(validCharts, maxDepth, maxWidth);
		});

	}

	function createAllCrossSections(charts, maxDepth, maxWidth) {
		// Create a chart for each of them
		var plots = [];
		_.each(charts, function(chart){
			plots.push(createCrossSection(chart.id, chart.title, chart.wetWidth, chart.depthMeasurements, maxWidth, maxDepth));
		});
		return plots;
	}

	function createCrossSection(chartDivId, title, wetWidth, depthMeasurements, maxWidth, maxDepth) {	
		// Draw a wicked graph
		var points = [];
		var wetWidthPoints = [];
		var depthPoints = [];
		var numDepthPoints = depthMeasurements.length;
		var sectionWidth = wetWidth / numDepthPoints;
		var seriesDescriptions = [];
		var options = {
			title: title,
			axes: {
				xaxis: {
					min: 0,
					max: maxWidth
				},
				yaxis: {
					min: -(maxDepth + (maxDepth / 10)),
					max: 0
				}
			},
			axesDefaults: {
				tickOptions: {
					formatString: "%.1f"
				}
			},
			seriesColors: ["#33CCFF","#996633"],
			seriesDefaults: {
				fill: true
			}
		};
						
		for(var i = 0; i < numDepthPoints; i++) {
			wetWidthPoints.push([sectionWidth * i,0]);
			depthPoints.push([sectionWidth * i, 0 - depthMeasurements[i]]);				
		}
		points.push(wetWidthPoints)
		points.push(depthPoints);
		
		return $.jqplot(chartDivId,points,options);
	}

})(FLAIR, Backbone, _, $);