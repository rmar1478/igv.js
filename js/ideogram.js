/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Broad Institute
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

//
// Chromosome ideogram
//

var igv = (function (igv) {

    igv.IdeoPanel = function (parentElement) {

        this.ideograms = {};

        this.div = $('<div class="igv-ideogram-div"></div>')[0];
        $(parentElement).append(this.div);

        // ideogram label
        var chromosomeNameDiv = $('<div class="igv-ideogram-chr-div"></div>');
        this.div.appendChild(chromosomeNameDiv[ 0 ]);

        this.chromosomeNameLabel = $('<div>')[0];
        $(chromosomeNameDiv).append(this.chromosomeNameLabel);

        // ideogram content
        var contentDiv = $('<div class="igv-ideogram-content-div"></div>')[0];
        $(this.div).append(contentDiv);
        contentDiv.style.left = igv.browser.controlPanelWidth + "px";

        var canvas = $('<canvas class="igv-ideogram-canvas"></canvas>')[0];
        $(contentDiv).append(canvas);
        canvas.setAttribute('width', contentDiv.clientWidth);
        canvas.setAttribute('height', contentDiv.clientHeight);
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

    };

    igv.IdeoPanel.prototype.resize = function () {

        this.canvas.setAttribute('width',  this.div.clientWidth);
        this.canvas.setAttribute('height', this.div.clientHeight);

        this.ideograms = {};
        this.repaint();
    };

    igv.IdeoPanel.prototype.repaint = function () {

        try {
            var image,
                bufferCtx,
                chromosome,
                ideoScale,
                widthBP,
                boxPX,
                boxW,
                genome = igv.browser.genome,
                referenceFrame = igv.browser.referenceFrame,
                stainColors = [];

            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            if (!(genome && genome.getChromosome(referenceFrame.chr))) {
                return;
            }

            image = this.ideograms[igv.browser.referenceFrame.chr];

            if (!image) {

                image = document.createElement('canvas');
                image.width = this.canvas.width;
                image.height = 13;

                bufferCtx = image.getContext('2d');

                drawIdeogram(bufferCtx, this.canvas.width, 13);

                this.ideograms[igv.browser.referenceFrame.chr] = image;
            }

            this.ctx.drawImage(image, 0, (this.canvas.height - image.height) / 2.0);

            // Draw red box
            this.ctx.save();

            chromosome = igv.browser.genome.getChromosome(igv.browser.referenceFrame.chr);
            ideoScale = this.canvas.width / chromosome.bpLength;

            widthBP = this.canvas.width * igv.browser.referenceFrame.bpPerPixel;
            if (widthBP < chromosome.bpLength) {

                boxPX = Math.round(igv.browser.referenceFrame.start * ideoScale);
                boxW = Math.max(1, Math.round(widthBP * ideoScale));

                this.ctx.strokeStyle = "red";
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(boxPX, 9, boxW, 15);
                this.ctx.restore();
            }

            this.chromosomeNameLabel.innerHTML = referenceFrame.chr;
        } catch (e) {
            console.log("Error painting ideogram: " + e.message);
        }


        function drawIdeogram(bufferCtx, ideogramWidth, ideogramHeight) {

            var ideogramTop = 0;

            if (!genome) return;

            var chromosome = genome.getChromosome(referenceFrame.chr);
            if (!chromosome) return;

            var cytobands = chromosome.cytobands;


            var center = (ideogramTop + ideogramHeight / 2);

            var xC = [];
            var yC = [];

            var len = cytobands.length;
            if (len == 0) return;

            var chrLength = cytobands[len - 1].end;

            var scale = ideogramWidth / chrLength;

            var lastPX = -1;
            for (var i = 0; i < cytobands.length; i++) {
                var cytoband = cytobands[i];

                var start = scale * cytoband.start;
                var end = scale * cytoband.end;
                if (end > lastPX) {


                    if (cytoband.type == 'c') { // centermere: "acen"

                        if (cytoband.label.charAt(0) == 'p') {
                            xC[0] = start;
                            yC[0] = ideogramHeight + ideogramTop;
                            xC[1] = start;
                            yC[1] = ideogramTop;
                            xC[2] = end;
                            yC[2] = center;
                        } else {
                            xC[0] = end;
                            yC[0] = ideogramHeight + ideogramTop;
                            xC[1] = end;
                            yC[1] = ideogramTop;
                            xC[2] = start;
                            yC[2] = center;
                        }
                        bufferCtx.fillStyle = "rgb(150, 0, 0)"; //g2D.setColor(Color.RED.darker());
                        bufferCtx.strokeStyle = "rgb(150, 0, 0)"; //g2D.setColor(Color.RED.darker());
                        bufferCtx.polygon(xC, yC, 1, 0);
                        // g2D.fillPolygon(xC, yC, 3);
                    } else {

                        bufferCtx.fillStyle = getCytobandColor(cytoband); //g2D.setColor(getCytobandColor(cytoband));
                        bufferCtx.fillRect(start, ideogramTop, (end - start), ideogramHeight);
                        // context.fillStyle = "Black"; //g2D.setColor(Color.BLACK);
                        // context.strokeRect(start, y, (end - start), height);
                    }
                }

                bufferCtx.strokeStyle = "black";
                bufferCtx.roundRect(0, ideogramTop, ideogramWidth, ideogramHeight, ideogramHeight / 2, 0, 1);
                //context.strokeRect(margin, y, trackWidth-2*margin, height);
                lastPX = end;

            }
        }

        function getCytobandColor(data) {
            if (data.type == 'c') { // centermere: "acen"
                return "rgb(150, 10, 10)"

            } else {
                var stain = data.stain; // + 4;

                var shade = 230;
                if (data.type == 'p') {
                    shade = Math.floor(230 - stain / 100.0 * 230);
                }
                var c = stainColors[shade];
                if (c == null) {
                    c = "rgb(" + shade + "," + shade + "," + shade + ")";
                    stainColors[shade] = c;
                }
                return c;

            }
        }

    }

    return igv;
})
(igv || {});