# Ecosystem Interconnection Visualizer

Live copy at https://airbrx.com/ecosystem/ecosystem-documenation-tool.html

1. Reads from default settings if you don't have edits of your own in localstorage (I'm still playing with the default ecosystem)
2. Stores your changes in the browser, but you can use the buttons for "View Workflows JSON" and "View Ecosystem JSON" to grab a copy of what you've changed
3. You can upload workflow and ecosystem JSON with the "Load Custom JSON" button.  It checks (lightly) format and identifies which you're uploading (todo: full schema check)
4. Clicking on a wireframe item reduces the view to just the immediate connectors to that item and shows the description (there's a minor layer problem I need to fix where elipses might overlap, but you can drag them out of your way)
5, The pencil allows you to edit the relationships and text
6. The "View All Entities" brings back the chaotic big view
7. The views can also be filtered by workflows (todo: right now you have to View All first)

The idea here is that we should be able to basically do a system/process review (see https://airbrx.com/ecosystem/editor.html for a view that's basically an asset management view and editor).  Once we get all those systems listed we can start working through the actual business workflows to visualize what systems are required for that workflow, and from there it should be easy to say what could be improved.  And easier to explain why it's important and difficult
