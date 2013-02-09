<%inherit file="/base.mako"/>
<%def name="id()">task_new</%def>
<%def name="title()">New Task</%def>

<div class="container">
    <form method="post" action="" class="form-horizontal">
        <legend>New Task</legend>
        <div class="control-group">
            <label class="control-label" for="id_short_description">Short Description</label>
            <div class="controls">
            <input type="text" class="text input-xxlarge" id="id_short_description" name="short_description" value="" />
            </div>
        </div>
        <div class="row">
            <div class="span6">
                <div class="control-group">
                    <label class="control-label" for="id_zoom">Zoom level</label>
                    <div class="controls">
                        <select id="id_zoom" name="zoom">
                             <option>10</option>
                             <option>11</option>
                             <option selected="selected">12</option>
                             <option>13</option>
                             <option>14</option>
                             <option>15</option>
                             <option>16</option>
                             <option>17</option>
                             <option>18</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
        <div class="form-actions">
            <input type="submit" class="btn btn-primary" value="Create the task" id="id_submit" name="form.submitted"/>
        </div>
    </form>
</div>
