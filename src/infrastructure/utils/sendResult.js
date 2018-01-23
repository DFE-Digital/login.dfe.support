const mapMimeType = (mimeType) => {
  switch (mimeType.toLowerCase()) {
    case 'application/json':
      return 'json';
      break;
    case 'text/html':
      return 'html';
      break;
  }
  return undefined;
};

const sendResult = (req, res, viewName, data) => {
  const accepts = req.accepts();
  let renderType;

  if (accepts instanceof String) {
    renderType = mapMimeType(accepts);
  } else if (accepts instanceof Array) {
    for (let i = 0; i < accepts.length && !renderType; i++) {
      renderType = mapMimeType(accepts[i]);
    }
  }

  if (!renderType) {
    renderType = 'html';
  }

  if (renderType === 'json') {
    return res.contentType('json').send(JSON.stringify(data));
  }
  return res.render(viewName, data);
};

module.exports = sendResult;
