# JSON commenter

A JSON stringify tool, with ability to add comment to the data.

Just wanna preserve API response on the screen, but raw data is hard to read. How don't we put comment on it?

```json
{
    "timestamp": 1613055600,  // 2021-02-11 23:00:00
    "status": 5,  // Pending
    "message": "happy new year!"
}
```

Of course JSON do not allow comment on it, the output string would no longer be the a valid JSON.
There would have thousand ways to backup raw response before render. But it we don't, we could still use some third party parser like [hjson](https://hjson.github.io/) to parse this string.


## Usage

We could have a sample data like this:

```json
{
  "firstName": "Eren",
  "lastName": "Jaeger",
  "isAlive": true,
  "birthday": "835/3/30",
  "address": {
    "city": "Trost Dist.",
    "country": "Eldian"
  },
  "troop":[
    {
      "name": "Training Corps"
    },
    {
      "name": "Survey Corps"
    }
  ],
  "intro": "Eren Jaeger in the Funimation dub and subtitles of the anime, is a fictional\ncharacter and the protagonist of the Attack on Titan manga series created by\nHajime Isayama.",
  "children": [],
  "spouse": null
}
```

And generate a object/map for comments:

```javascript
{
    "birthday": "19 years old",
    "address": {
        "city": "south region",
    },
    "troop": new Map().set(sample.troop[0], {"name": "104th"}),
}
```

> NOTE this script use simple key matching for retrieving comments.
> You should align the object structure with the original data.
> For data in array, you MUST use map and set key as the array element or it could NOT get the data for it.

Import `commenter.js` and call `stringify`:

```html
<script type="module" src="commenter.js"></script>
<script type="module">
import { stringify } from "./commenter.js";
stringify(sample, comment);
</script>
```

Then we could get:

```json
{
    "firstName": "Eren",
    "lastName":  "Jaeger",
    "isAlive":   true,
    "birthday":  "835/3/30",  // 19 years old
    "address":   {
                     "city":    "Trost Dist.",  // south region
                     "country": "Eldian"
                 },
    "troop":     [
                     {
                         "name": "Training Corps"  // 104th
                     },
                     {
                         "name": "Survey Corps"
                     }
                 ],
    "intro":     '''
                 Eren Jaeger in the Funimation dub and subtitles of the anime, is a fictional
                 character and the protagonist of the Attack on Titan manga series created by
                 Hajime Isayama.''',
    "children":  [],
    "spouse":    null
}
```

### Advanced usage

There're several configs could be customized by creating a new `commenter`.
For example, use following settings:

```javascript
commenter({
    "symbolComment": "  # ",
    "symbolNull": "None",
    "symbolBooleanTrue": "True",
    "symbolBooleanFalse": "False",
}).stringify(sample, comment);
```

We could make the output look like Python code:

```py
{
    "firstName": "Eren",
    "lastName":  "Jaeger",
    "isAlive":   True,
    "birthday":  "835/3/30",  # 19 years old
    "address":   {
                     "city":    "Trost Dist.",  # south region
                     "country": "Eldian"
                 },
    "troop":     [
                     {
                         "name": "Training Corps"  # 104th
                     },
                     {
                         "name": "Survey Corps"
                     }
                 ],
    "intro":     '''
                 Eren Jaeger in the Funimation dub and subtitles of the anime, is a fictional
                 character and the protagonist of the Attack on Titan manga series created by
                 Hajime Isayama.''',
    "children":  [],
    "spouse":    None
}
```
