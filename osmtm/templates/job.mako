<%!
    import markdown
%>
<%inherit file="/base.mako"/>
<%def name="id()">job</%def>
<%def name="title()">Job - ${job.title}</%def>
<div class="container">
    <div class="page-header">
        <h3>
        ${job.title}
        </h3>
    </div>
    <div class="row">
        <div class="span6">
            <div class="tab-pane active" id="description">
                <p>${markdown.markdown(job.description)|n}</p>
            </div>
        </div>
    </div>
</div>
