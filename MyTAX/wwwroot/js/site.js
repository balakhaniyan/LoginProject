let label_top_css = {
    'font-size': '0.5rem',
    'top': '-1rem',
}
let label_main_css = {
    'font-size': '0.7rem',
    'top': '0',
}

$(function () {
    $(".input-holder input").each(function () {
        if ($(this).val() !== "") {
            $(this).parent().find("label").css(label_top_css)
        }
    });

    $(".input-holder").on("click", function () {
        $(this).find("input").focus();
        $(this).find("label").css(label_top_css)
    });
    
    $(".input-holder input").on("blur", function () {
        if ($(this).val() === "") {
            $(this).parent().find("label").css(label_main_css)
        }
    }).on('keyup', function () {
        $(this).parent().find("label").css($(this).val() === "" ? label_main_css : label_top_css)
    });

    $("input[type='reset']").on("click", function () {
        $(".input-holder input").each(function () {
            $(this).parent().find("label").css(label_main_css)
        });
    });
});