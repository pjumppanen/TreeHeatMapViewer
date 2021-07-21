TreeHeatMapperViewer
--------------------
This HTML5 based application visualises a phylogenetic tree against a
heat map showing species matching degree.To use download the entire source
tree to local disk, open TreeHeatMapViewer.html with a HTML5 compatible
web browser, click on the"Open..." button, click on "Tree File:Browse..."
and navigate to the subfolder,

.\ExampleData\SmallTreeand select the file,2016_11_C_GAB_BP_taxonomy.ntree

then click on "OTU Context File:Browse..." and select the file,

GAB_alkB_BP_context_14102016.csv

then click on "key column" for that file and select "sample_ID", then
click on "OTU Context File:Browse..." and select the file,

GAB_alkB_BP_OTU_14102016.csv

and leave the "key column" for that files as "OTU_Full_ID" and press the
"Open" button.


A tree will be displayed on the left with corresponding heatmap on the
right. The clades on the left can be expanded or collapsed by clicking on
the corresponding nodes (yellow and grey circles). The heat map will
update the statistics to match the species groupings.

The divider between the tree and the heat map (grey vertical line) can be
dragged (mouse down on bar, drag and mouse up) horizontally to change the
amount of screen realestate dedicated to the tree and the heat map.
In the heat map sample code names / OTU names are displayed along the top
margin and if clicked will display a summary of the contextual information
for that sample. Mousing over the heat map entries will display the
species name, sample code / OTU and the heat map value. Clicking on it
will display that information plus the contextual information.

The heatmap on the extreme right can be configured by clicking on it.
This opens a configuration dialog box where you can specify any number of
colour map limit points. The default is two bands:

Limit, Colour
0.01,  dark blue
32700, yellow

with logarithmic scaling. The Blend check box dictates whether colours
in between those limits will be determined by interpolation or discretized.
With blend on the colours between are interpolated. In this case with
blend off values less than or equal to 0.01 will be left blank, values
greater than 0.01 but less than 32700 will be rendered dark blue and values
greater than 32700 will be rendered yellow. With blend on the behaviour at
between limits 0.01 and 32700 is to transition the colour using HSL colour
mapping. You can add or remove bands using the +/- buttons. This can be
useful for highlighting ranges with more contrasting changes in colour
with value.

The "Selection..." button in the top left hand corner of the screen if
pressed will open a dialog box that will allow you to filter what is
displayed on the heat map using logical expressions. For instance, if I
click on "Voyage_year" in the upper list and click the "->" next to it the
"Voyage_year" field will be added to the expression pane. Clicking on the
drop down list below the field list shows the years available. If I click
on "2013" add an "=" sign to the expression and then click on the "->"
next to the field value dropdown I will have created the logical
expression,

Voyage_year=2013

If I now click ok then the heat map will only show records from 2013.

The expression field can be any valid javascript logical expression
containing field names and values. For instance, I can expand my
qualification to only include "sediment" records by adding " and " to
the end of the previous expression, clicking on "Sample_Type" and then
clicking the "->" button, adding "=" and then clicking on "sediment" and
"->" to give the expression,

Voyage_year=2013 and [Sample Type]='sediment'

and pressing Ok. Doing so, you will note that the number of OTU's
displayed has reduced. This mechanism provides great flexibility in
filtering results to a smaller subset.

Expected File Formats
---------------------
The context file is a csv file with key contextual parameters organised
in columns and the first line must contain column names to identify them.
In the example the first few lines are,

Sample code,ADSsample_number,ADS_short,sample_ID,Sample,VoyageSampleID,Voyage_year,Voyage,Sample Type,Collection,Station,Transect,Depth_actual,Depth
GAB6329,102.100.100/26780,26780,GAB6329,6329,W13/006329,2013,1,sediment,ICP,14,2,188,200
GAB6330,102.100.100/26781,26781,GAB6330,6330,W13/006330,2013,1,sediment,ICP,14,2,188,200
GAB6331,102.100.100/26782,26782,GAB6331,6331,W13/006331,2013,1,sediment,ICP,14,2,188,200
.
.
.

The OTU file is a csv file containing the heat map value data with one
column per Context file key (sample_ID in this case) plus a column to
identify the species in the phylogenetic tree (OTU_Full_ID in this case).

OTU_Full_ID,GAB6329,GAB6330,GAB6331,GAB6858,GAB6859,GAB6860,GAB6409,GAB6410,GAB6411,GAB6930,GAB6931,GAB6932,GABS002,GABS003,GABS008,GAB6634,GAB6635,GAB6636,GAB7003,GAB7004,GAB7005,GAB5926,GAB5927,GAB5928,GAB5284,GAB5285,GAB5286,GAB5869,GAB5870,GAB5871,GAB5358,GAB5359,GAB5360,GABS005,GABS006,GABS013,GABS017,GABS023,GABS024,GAB6701,GAB5427,GAB5732,GAB6280,GAB6702,GAB6802,GAB6360,GAB6878,GAB5733,GAB6703,GAB5428,GABW005,GAB5734,GAB6582,GAB6704,GAB6951,GAB5735,GAB5232,GAB5429,GAB5594,GAB5430
GAB_alkB_OTUb_4_BPA_1401_Chevron_10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,682,417,103,179,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
GAB_alkB_OTUa_86_BPA_2218_Chevron_213,0,0,0,0,0,0,0,0,0,0,0,0,2,40,0,67,50,37,33,1,24,30,9,44,187,133,77,31,34,47,114,47,41,0,60,490,224,148,248,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
GAB_alkB_OTUa_289_BPA_1584_Chevron_155,0,0,0,0,0,0,0,0,0,0,0,0,2,25,0,55,35,24,22,1,21,18,6,16,141,74,61,20,41,30,76,38,20,0,34,356,166,95,207,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0
.
.
.

The tree file format is the Newick format(https://en.wikipedia.org/wiki/Newick_format)
and must contain all the species in the OTU file.
