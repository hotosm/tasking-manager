$(document).ready(function() {
    var converter = new Showdown.converter();

    var short_description = $('#id_short_description'),
        short_description_preview = $('#short_description_preview');
    short_description.keyup(function() {
        var html = converter.makeHtml(short_description.val());
        short_description_preview.html(html);
    }).trigger('keyup');

    var description = $('#id_description'),
        description_preview = $('#description_preview');
    description.keyup(function() {
        var html = converter.makeHtml(description.val());
        description_preview.html(html);
    }).trigger('keyup');

    var workflow = $('#id_workflow'),
        workflow_preview = $('#workflow_preview');
    workflow.keyup(function() {
        var html = converter.makeHtml(workflow.val());
        workflow_preview.html(html);
    }).trigger('keyup');
});
