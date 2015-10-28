$(document).ready(function() {
    var source   = $("#page-template").html();
    var template = Handlebars.compile(source);
    var imgPreview = Handlebars.compile($("#preview-template").html());

    var renderPages = function(data) {
        console.log(data);
        $(".list").html(template({ pages:data }));
    };

    $("body").on("click", "a.trigger-preview", function(e) {
        var id = $(this).data("id");
        console.log(id);

        $(".preview").html( imgPreview({id: id}));

        e.preventDefault();
    }).on("click", ".trigger-approve", function(e) {
        var id = $(this).data("id");
        console.log(id);

        $.ajax({
            dataType: "json",
            url: $(this).attr('href'),
            success: function() {
                $("[data-page-id=" + id + "]").remove();
            }
        });

        e.preventDefault();
    });


    $.ajax({
        dataType: "json",
        url: "/pages",
        success: renderPages
    });
});
