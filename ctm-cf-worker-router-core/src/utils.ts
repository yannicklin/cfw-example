class ElementAppender implements HTMLRewriterElementContentHandlers {
  scriptElement: string;
  append: boolean;

  constructor(scriptElement: string, append: boolean) {
    this.scriptElement = scriptElement;
    this.append = append;
  }

  element(element: Element) {
    if (this.append) element.append(this.scriptElement, { html: true });
    else element.prepend(this.scriptElement, { html: true });
  }
}

class ElementSwapper implements HTMLRewriterElementContentHandlers {
  replacementHTML: string;

  constructor(replacementHTML: string) {
    this.replacementHTML = replacementHTML;
  }

  element(element: Element) {
    element.after(this.replacementHTML, { html: true });
    element.remove();
  }
}

class ElementRewriterbyTextChunk implements HTMLRewriterElementContentHandlers {
  newContent: string;
  dynamicGenerate: boolean;
  generationFunction: Function | undefined;
  generationFunctionParams: string[];
  elmContentBuffer: string;

  constructor(newContent: string, dynamicGenerate?: boolean, generationFunction?: Function, generationFunctionParams?: string[]) {
    this.newContent = newContent;
    this.dynamicGenerate = (dynamicGenerate === true);
    this.generationFunction = generationFunction;
    this.generationFunctionParams = generationFunctionParams ?? [];
    this.elmContentBuffer = "";
  }

  text(text: Text) {
    this.elmContentBuffer += text.text;
    if (text.lastInTextNode) {
      let newElementContent: string;
      if (this.dynamicGenerate && "undefined" != typeof this.generationFunction) {
        let newFuncParmas: string[] = [this.elmContentBuffer].concat(this.generationFunctionParams);
        newElementContent = this.generationFunction.apply(null, newFuncParmas);
      } else {
        newElementContent = this.newContent;
      }

      text.replace(newElementContent);
      this.elmContentBuffer = "";
    } else {
      text.remove();
    }
  }
}

export class AttributeRewriter implements HTMLRewriterElementContentHandlers {
  attributeName: string;
  newValuePrepared: string;
  dynamicGenerate: boolean;
  generationFunction: Function | undefined;
  generationFunctionParams: string[];

  constructor(attributeName: string, newValuePrepared: string, dynamicGenerate?: boolean, generationFunction?: Function, generationFunctionParams?: string[]) {
    this.attributeName = attributeName;
    this.newValuePrepared = newValuePrepared;
    this.dynamicGenerate = (dynamicGenerate === true);
    this.generationFunction = generationFunction;
    this.generationFunctionParams = generationFunctionParams ?? [];
  }

  element(element: Element) {
    const attributeValue = element.getAttribute(this.attributeName);

    if (attributeValue) {
      let newValue: string;
      if (this.dynamicGenerate && "undefined" != typeof this.generationFunction) {
        let newFuncParmas: string[] = [attributeValue].concat(this.generationFunctionParams);
        newValue = this.generationFunction.apply(null, newFuncParmas);
        console.log(`Wondering what params sent through, newFuncParmas :: ${newFuncParmas}`);
      } else {
        newValue = this.newValuePrepared;
      }
      element.setAttribute(this.attributeName, newValue);
      console.log(`rewrote attribute with name ${this.attributeName} to value ${newValue}`);
    }
  }
}

/**
 * Location to inject a script at
 */
export enum InjectLocation {
  HeadStart,
  HeadEnd,
  BodyStart,
  BodyEnd
}

/**
 * Location for Element/Attribute replace at
 */
export enum ReplaceLocation {
  HeadTitle,
  HeadMeta,
  BodyAside
}

/** Takes a response and if it contains html injects the body of the provided functions into a script tag in the response body
 * @param originalResponse The response to inject the script into
 * @param scriptFunctions The scripts to inject
 * @param location The location in the html doc, to inject the script
 */
export function injectScripts(
  originalResponse: Response,
  scriptFunctions: ((() => void) | string)[],
  location = InjectLocation.HeadEnd
): Response {
  //Leave any non-html requests unchanged
  if (scriptFunctions == null || scriptFunctions.length == 0) return originalResponse;
  const scriptContent = getScriptContent(scriptFunctions);

  const wrappedScript = `
  <script>
  ${scriptContent}
  </script>
  `;

  // Read the original response text and inject the script
  return InjectIntoHtml(originalResponse, wrappedScript, location);
}

/**
 * Inject code with script tags and wrap with provided wrapper strings.
 * @param originalResponse Response to inject the script into
 * @param scriptFunctions Script to inject
 * @param location Location to inject wrapped script within html doc
 * @param wrapperStart Code to wrap around script start
 * @param wrapperEnd Code to wrap around script end
 * @param scriptProp Properties for script tag
 */
export function injectScriptsWithWrapper(
  originalResponse: Response,
  scriptFunctions: ((() => void) | string)[],
  location: InjectLocation = InjectLocation.HeadEnd,
  wrapperStart: string,
  wrapperEnd: string,
  scriptProp: string
): Response {
  //Leave any non-html requests unchanged
  if (scriptFunctions == null || scriptFunctions.length == 0) return originalResponse;

  const scriptContent = getScriptContent(scriptFunctions);

  const wrappedScript = `
  ${wrapperStart}
  <script ${scriptProp}>
  ${scriptContent}
  </script>
  ${wrapperEnd}
  `;

  // Read the original response text and inject the script
  return InjectIntoHtml(originalResponse, wrappedScript, location);
}

/**
 * Get script content as string.
 * @param scriptFunctions
 */
function getScriptContent(scriptFunctions: ((() => void) | string)[]): string {
  let scriptContent = "";
  scriptFunctions.forEach((script) => {
    if (typeof script === "string") scriptContent += script + "\n";
    else scriptContent += getFunctionBody(script) + "\n";
  });
  return scriptContent;
}

/**
 * Replace vars in given string eg. loading env vars when injecting scripts to responses.
 * @param str String with vars (appended with $ eg. $ENV_VAR)
 * @param vars Object of vars and values to to be replaced
 */
export function replaceVars(str: string, vars: any): string {
  let updatedStr = str;
  const keys = Object.keys(vars);
  keys.forEach((key, index) => {
    let regexKey = new RegExp("\\$" + key,"g");
    updatedStr = updatedStr.replace(regexKey, `${vars[key]}`);
  });
  return updatedStr;
}

/** Takes a response and if it contains html injects the body of the provided function into a script tag in the response body
 * @param originalResponse The response to inject the script into
 * @param scriptFunction Either a string to inject into the script tag or a function who's body will be injected. This should obviously not return anything or have any dependencies
 * @param location The location in the html doc, to inject the script
 */
export function injectScript(
  originalResponse: Response,
  scriptFunction: (() => void) | string,
  location: InjectLocation = InjectLocation.HeadEnd
): Response {
  //Leave any non-html requests unchanged
  let scriptContent: string = "";
  if (typeof scriptFunction === "string") scriptContent = scriptFunction;
  else scriptContent = getFunctionBody(scriptFunction);

  const wrappedScript = `
  <script>
  ${scriptContent}
  </script>
  `;
  // Read the original response text and inject the script
  return InjectIntoHtml(originalResponse, wrappedScript, location);
}

/**
 * Takes a response and if it contains html injects the provided content into the response body
 * @param originalResponse the original response before any script injection
 * @param addedContent the script to add to the response
 * @param location the location of where the script should be inserted
 * @returns
 */
export function InjectIntoHtml(originalResponse: Response, addedContent: string, location: InjectLocation = InjectLocation.HeadEnd): Response {
  console.log("Injecting content into html");
  const contentType: string | null = originalResponse.headers.get("Content-Type");
  if (contentType == null || !contentType.includes("text/html")) {
    console.log("Couldn't find a Content-Type header containing 'text/html'. Skipping injecting");
    return originalResponse;
  }

  const tag: "head" | "body" = (location == InjectLocation.HeadEnd || location == InjectLocation.HeadStart) ? "head" : "body";
  const append: boolean = location == InjectLocation.HeadEnd || location == InjectLocation.BodyEnd;
  const rewriter: HTMLRewriter = new HTMLRewriter().on(tag, new ElementAppender(addedContent, append));

  // Create a new response with the modified HTML
  return rewriter.transform(originalResponse);
}

type InjectableScript = string;

/** Gets the body of a function as a string
 *
 */
export function getFunctionBody(func: Function): InjectableScript {
  // Get the string representation of the function.
  const funcString: string = func.toString();

  // Extract the body of the function by removing the function signature
  // and the opening and closing curly braces.
  const bodyStart: number = funcString.indexOf("{") + 1;
  const bodyEnd: number = funcString.lastIndexOf("}");
  return funcString.substring(bodyStart, bodyEnd).trim();
}

/**
 * Gets a function as a string
 */
export function getFunction(func: Function): InjectableScript {
  // Get the string representation of the function.
  return func.toString();
}

/**
 * Takes a response and if it contains html injects the provided content into the response body
 * @param originalResponse the original response before any script injection
 * @param addedContent the script to add to the response
 * @param location the location of where the script should be inserted
 * @returns
 */
export function ReplacewithinHTML(originalResponse: Response, newContent: string, location: ReplaceLocation = ReplaceLocation.HeadTitle, Configs: any): Response {
  console.log("HTML Content replacement in preparation.");
  const contentType: string | null = originalResponse.headers.get("Content-Type");
  if (contentType == null || !contentType.includes("text/html")) {
    console.log("Couldn't find a Content-Type header containing 'text/html'. Skipping replacement");
    return originalResponse;
  }

  let rewriter: HTMLRewriter;
  let identifier: string;
  switch (location) {
    case ReplaceLocation.HeadTitle:
      identifier = "title";
      console.log(`HTML DOM replacement occurred on Head Title on ${identifier}`);

      rewriter = new HTMLRewriter().on(identifier, new ElementRewriterbyTextChunk(newContent, true, Configs["generationFunction"], Configs["generationFunctionParams"]));
      break;
    case ReplaceLocation.HeadMeta:
      identifier = "meta";
      if ((null != Configs["identifierAttributeName"]) && (null != Configs["identifierAttributeValue"])) {
        identifier += "[" + Configs["identifierAttributeName"] + "='" + Configs["identifierAttributeValue"] + "']";
      }
      console.log(`HTML DOM replacement occurred on Head Meta on ${identifier}`);

      rewriter = new HTMLRewriter().on(identifier, new AttributeRewriter(Configs["targetAttributeName"], newContent, true, Configs["generationFunction"], Configs["generationFunctionParams"]));
      break;
    case ReplaceLocation.BodyAside:
      identifier = "aside";
      if ((null != Configs["identifierAttributeName"]) && (null != Configs["identifierAttributeValue"])) {
        identifier += "[" + Configs["identifierAttributeName"] + "='" + Configs["identifierAttributeValue"] + "']";
      }
      console.log(`HTML DOM replacement occurred on Body Aside on ${identifier}`);

      rewriter = new HTMLRewriter().on(identifier, new ElementSwapper(newContent));
      break;
  }

  // Create a new response with the modified HTML
  return rewriter.transform(originalResponse);
}

/**
 * HTML string minify / compress to single-line
 */
export function minifyHTMLElement(source: string): string {
  return source
    ? source
        .replace(/\>[\r\n ]+\</g, "><")
        .replace(/(<.*?>)|\s+/g, (m, $1) => ($1 ? $1 : " "))
        .trim()
    : "";
}