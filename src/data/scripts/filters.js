"use strict";

self.port.on("getCategories", function (categories) {
    $("#loading").hide();

    if(categories.length){
        $("#login").hide();
        $("#filters-settings").show().find("#categories").append($("#categories-template").mustache({categories: categories}));
        self.port.emit("getFilters", null);
    }
    else {
        $("#login").show();
        $("#filters-settings").hide();
    }
});

self.port.on("returnFilters", function(filtersData){
    $("#filters-enabled").prop("checked", filtersData.isFiltersEnabled).trigger("change");

    var filters = filtersData.filters || [];
    filters.forEach(function(id){
        $("#categories").find("input[data-id='" + id +"']").attr("checked", "checked");
    });
});

$("#login").click(function () {
    self.port.emit("updateToken", null);
});

$("#save").click(function(){
    self.port.emit("saveFilters", {filters: parseFilters(), isFiltersEnabled: $("#filters-enabled").prop("checked")});
});

$("#filters-enabled").on("change", function(){
    if($(this).prop("checked")){
        $("#categories").removeAttr("disabled");
    } else {
        $("#categories").attr("disabled", "disabled");
    }
});

function parseFilters() {
    var filters = [];
    $("#categories").find("input[type='checkbox']:checked").each(function (key, value) {
        var checkbox = $(value);
        filters.push(checkbox.data("id"));
    });
    return filters;
}